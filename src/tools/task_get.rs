//! Task retrieval tool for reading task details with access control.

use crate::tasks::TaskStore;
use rig::completion::ToolDefinition;
use rig::tool::Tool;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct TaskGetTool {
    task_store: Arc<TaskStore>,
    agent_id: String,
}

impl TaskGetTool {
    pub fn new(task_store: Arc<TaskStore>, agent_id: impl Into<String>) -> Self {
        Self {
            task_store,
            agent_id: agent_id.into(),
        }
    }
}

#[derive(Debug, thiserror::Error)]
#[error("task_get failed: {0}")]
pub struct TaskGetError(String);

#[derive(Debug, Deserialize, JsonSchema)]
pub struct TaskGetArgs {
    /// Task number to retrieve (#N).
    pub task_number: i32,
}

#[derive(Debug, Serialize)]
pub struct TaskGetOutput {
    pub success: bool,
    pub task: Option<crate::tasks::Task>,
    pub message: String,
}

impl Tool for TaskGetTool {
    const NAME: &'static str = "task_get";

    type Error = TaskGetError;
    type Args = TaskGetArgs;
    type Output = TaskGetOutput;

    async fn definition(&self, _prompt: String) -> ToolDefinition {
        ToolDefinition {
            name: Self::NAME.to_string(),
            description: crate::prompts::text::get("tools/task_get").to_string(),
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "task_number": {
                        "type": "integer",
                        "description": "Task number to retrieve (#N)"
                    }
                },
                "required": ["task_number"]
            }),
        }
    }

    async fn call(&self, args: Self::Args) -> Result<Self::Output, Self::Error> {
        let task_number = i64::from(args.task_number);

        let task = self
            .task_store
            .get_by_number(task_number)
            .await
            .map_err(|error| TaskGetError(format!("{error}")))?;

        let Some(task) = task else {
            return Ok(TaskGetOutput {
                success: false,
                task: None,
                message: format!("task #{} not found", task_number),
            });
        };

        // Access control: allow if the agent owns the task, created it, or is assigned to it.
        let has_access = task.owner_agent_id == self.agent_id
            || task.created_by == format!("agent:{}", self.agent_id)
            || task.assigned_agent_id == self.agent_id;

        if !has_access {
            return Err(TaskGetError(format!(
                "access denied: you don't have permission to view task #{task_number}"
            )));
        }

        Ok(TaskGetOutput {
            success: true,
            task: Some(task),
            message: format!("Retrieved task #{}", task_number),
        })
    }
}
