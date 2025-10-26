import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	const env = loadEnv(mode, process.cwd(), '');
	
	return {
		plugins: [tailwindcss(), sveltekit()],
		define: {
			'import.meta.env.GOOGLE_MAPS_API_KEY': JSON.stringify(env.GOOGLE_MAPS_API_KEY || 'your_google_maps_api_key_here')
		},
	build: {
		target: 'esnext',
		rollupOptions: {
			external: [
				'@node-rs/argon2',
				'@node-rs/argon2-wasm32-wasi',
				'@node-rs/argon2-win32-x64-msvc',
				'@node-rs/argon2-darwin-arm64',
				'@node-rs/argon2-darwin-x64',
				'@node-rs/argon2-linux-arm-gnueabihf',
				'@node-rs/argon2-linux-arm64-gnu',
				'@node-rs/argon2-linux-arm64-musl',
				'@node-rs/argon2-linux-x64-gnu',
				'@node-rs/argon2-linux-x64-musl',
				'@node-rs/argon2-freebsd-x64',
				'@node-rs/argon2-android-arm-eabi',
				'@node-rs/argon2-android-arm64',
				'@node-rs/argon2-win32-arm64-msvc',
				'@node-rs/argon2-win32-ia32-msvc'
			]
		}
	},
	optimizeDeps: {
		exclude: ['@node-rs/argon2']
	},
	ssr: {
		noExternal: ['@node-rs/argon2']
	}
	};
});
