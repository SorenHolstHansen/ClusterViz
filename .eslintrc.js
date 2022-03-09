module.exports = {
	root: true,
	parserOptions: {
		project: './tsconfig.json'
	},
	ignorePatterns: [
		'.eslintrc.js',
		'dist',
		'node_modules',
		'*.config.js',
		'*.config.ts',
		'*.config.cjs'
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
	rules: {
		'no-implicit-coercion': ['error'],
		'no-await-in-loop': ['error'],
		'no-unneeded-ternary': ['error', { defaultAssignment: false }],
		'no-var': 'error',
		'@typescript-eslint/explicit-function-return-type': [
			'warn',
			{
				allowExpressions: true
			}
		],
		'@typescript-eslint/strict-boolean-expressions': 'warn',
		'@typescript-eslint/ban-types': ['warn'],
		'@typescript-eslint/no-unnecessary-condition': ['error']
	}
};
