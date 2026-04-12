import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

	const spaceui = path.resolve(__dirname, "../../spaceui/packages");

	export default defineConfig({
		plugins: [react(), tailwindcss()],

		resolve: {
			dedupe: ["react", "react-dom"],
			alias: [
				// Pin React to a single copy (prevents "Invalid hook call")
				{
					find: /^react$/,
					replacement: path.resolve(
						__dirname,
						"./node_modules/react/index.js",
					),
				},
				{
					find: /^react\/jsx-runtime$/,
					replacement: path.resolve(
						__dirname,
						"./node_modules/react/jsx-runtime.js",
					),
				},
				{
					find: /^react\/jsx-dev-runtime$/,
					replacement: path.resolve(
						__dirname,
						"./node_modules/react/jsx-dev-runtime.js",
					),
				},
				{
					find: /^react-dom$/,
					replacement: path.resolve(
						__dirname,
						"./node_modules/react-dom/index.js",
					),
				},
				{
					find: /^react-dom\/client$/,
					replacement: path.resolve(
						__dirname,
						"./node_modules/react-dom/client.js",
					),
				},

				// SpaceUI - prefer source for HMR during local dev, fallback to node_modules
				{
					find: "@spacedrive/tokens/src/css",
					replacement: `${spaceui}/tokens/src/css`,
				},
				{
					find: "@spacedrive/tokens",
					replacement: path.resolve(
						__dirname,
						"./node_modules/@spacedrive/tokens",
					),
				},
				// Explicit aliases for @spacedrive/tokens exports that Tailwind needs to resolve
				{
					find: "@spacedrive/tokens/theme",
					replacement: path.resolve(
						__dirname,
						"./node_modules/@spacedrive/tokens/src/css/theme.css",
					),
				},
				{
					find: "@spacedrive/tokens/css",
					replacement: path.resolve(
						__dirname,
						"./node_modules/@spacedrive/tokens/src/css/base.css",
					),
				},
				{
					find: "@spacedrive/tokens/css/themes/light",
					replacement: path.resolve(
						__dirname,
						"./node_modules/@spacedrive/tokens/src/css/themes/light.css",
					),
				},
				{
					find: "@spacedrive/tokens/css/themes/dark",
					replacement: path.resolve(
						__dirname,
						"./node_modules/@spacedrive/tokens/src/css/themes/dark.css",
					),
				},
				{
					find: "@spacedrive/tokens/css/themes/midnight",
					replacement: path.resolve(
						__dirname,
						"./node_modules/@spacedrive/tokens/src/css/themes/midnight.css",
					),
				},
				{
					find: "@spacedrive/tokens/css/themes/noir",
					replacement: path.resolve(
						__dirname,
						"./node_modules/@spacedrive/tokens/src/css/themes/noir.css",
					),
				},
				{
					find: "@spacedrive/tokens/css/themes/slate",
					replacement: path.resolve(
						__dirname,
						"./node_modules/@spacedrive/tokens/src/css/themes/slate.css",
					),
				},
				{
					find: "@spacedrive/tokens/css/themes/nord",
					replacement: path.resolve(
						__dirname,
						"./node_modules/@spacedrive/tokens/src/css/themes/nord.css",
					),
				},
				{
					find: "@spacedrive/tokens/css/themes/mocha",
					replacement: path.resolve(
						__dirname,
						"./node_modules/@spacedrive/tokens/src/css/themes/mocha.css",
					),
				},
			// SpaceUI packages - resolve from node_modules for Docker builds
			// These packages are installed via npm, not symlinked from spaceui/
			{
				find: "@spacedrive/primitives",
				replacement: path.resolve(
					__dirname,
					"./node_modules/@spacedrive/primitives",
				),
			},
			{
				find: "@spacedrive/ai",
				replacement: path.resolve(
					__dirname,
					"./node_modules/@spacedrive/ai",
				),
			},
			{
				find: "@spacedrive/forms",
				replacement: path.resolve(
					__dirname,
					"./node_modules/@spacedrive/forms",
				),
			},
			{
				find: "@spacedrive/explorer",
				replacement: path.resolve(
					__dirname,
					"./node_modules/@spacedrive/explorer",
				),
			},

			// Project alias
			{ find: "@", replacement: path.resolve(__dirname, "src") },
		],
	},

	optimizeDeps: {
		exclude: [
			"@spacedrive/tokens",
			"@spacedrive/primitives",
			"@spacedrive/ai",
			"@spacedrive/forms",
			"@spacedrive/explorer",
		],
	},

	server: {
		port: 19840,
		fs: {
			allow: [
				path.resolve(__dirname, ".."),
				path.resolve(__dirname, "../../spaceui"),
			],
		},
		proxy: {
			"/api": {
				target: "http://127.0.0.1:19898",
				changeOrigin: true,
				timeout: 0,
				configure: (proxy) => {
					proxy.on("proxyReq", (_proxyReq, req, _res) => {
						if (req.headers.accept?.includes("text/event-stream")) {
							_proxyReq.socket?.setTimeout?.(0);
						}
					});
					proxy.on("proxyRes", (proxyRes, req) => {
						const ct = proxyRes.headers["content-type"] ?? "";
						if (ct.includes("text/event-stream")) {
							proxyRes.headers["cache-control"] = "no-cache";
							proxyRes.headers["x-accel-buffering"] = "no";
							proxyRes.socket?.setTimeout?.(0);
							req.socket?.setTimeout?.(0);
						}
					});
				},
			},
		},
	},

	build: {
		outDir: "dist",
		emptyOutDir: true,
		sourcemap: true,
	},
});
