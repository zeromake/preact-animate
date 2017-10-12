const rollupTypescript = require('rollup-plugin-typescript')
const pkg = require('./package.json')
const uglify = require('rollup-plugin-uglify')
const { minify } = require('uglify-es')

const isProduction = process.env.NODE_ENV === 'production'

// const resolve = require('rollup-plugin-node-resolve');
// const commonjs = require('rollup-plugin-commonjs');

const rollupTypescriptPlugin = rollupTypescript({
    typescript: require('typescript')
})

module.exports = {
    input: 'src/Animate.ts',
    name: 'animate',
    external: ['preact'],
    globals: {
        preact: 'preact'
	},
    plugins: !isProduction ? [
        rollupTypescriptPlugin
    ] : [
        rollupTypescriptPlugin,
        uglify({}, minify)
    ],
    sourcemap: !isProduction,
    output: isProduction ? [
        {
            format: 'umd',
            file: pkg["minified:main"]
        }
    ] : [
        {
            format: 'umd',
            file: pkg.main
        },
        {
            format: 'es',
            file: pkg.module
        }
	]
}
