import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

const shared = {
	plugins: [vue()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
};

export default defineConfig({
	...shared,
	test: {
		projects: [
			{
				...shared,
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/__tests__/*.test.ts'],
				},
			},
			{
				...shared,
				test: {
					name: 'component',
					environment: 'happy-dom',
					include: ['src/__tests__/component/**/*.test.ts'],
				},
			},
		],
	},
});
