import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), purgeCss()],
	resolve: {
		alias: {
			'@/': new URL('./src/', import.meta.url).pathname,
		},
	},
	server: {
		port: 5173,
	},
	test: {
		// 覆盖率
		coverage: {
			provider: 'v8',
			enabled: true
		},
		reporters: ['html'],
		environment: 'jsdom',
	}
});
