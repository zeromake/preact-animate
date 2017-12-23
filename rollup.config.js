const rollupTypescript = require('rollup-plugin-typescript')
const pkg = require('./package.json')
const uglify = require('rollup-plugin-uglify')
const { minify } = require('uglify-es')
const replace = require('rollup-plugin-replace')
const alias = require('rollup-plugin-alias')

const isProduction = process.env.NODE_ENV === 'production'

const isReact = process.env.REACT === 'react'
const reactStr = process.env.REACT

const replacePlugin = replace({
    REACT: JSON.stringify(process.env.REACT),
    ENV: JSON.stringify(process.env.NODE_ENV)
})
const aliasPlugin = alias({
    resolve: ['.ts'],
    'react-import': './import/' + reactStr + '-import'
})
const rollupTypescriptPlugin = rollupTypescript({
    typescript: require('typescript')
})

const basePlugins = [
    aliasPlugin,
    rollupTypescriptPlugin,
    replacePlugin
]
if (isProduction) {
    basePlugins.push(uglify({}, minify))
}
const external = [reactStr]
let globals = {
    [reactStr]: reactStr
}
if (isReact) {
    globals = {
        'react': 'React',
        'react-dom': 'ReactDOM'
    }
    external.push('react-dom')
}

module.exports = {
    input: 'src/Animate.ts',
    name: 'animate',
    external: external,
    globals: globals,
    plugins: basePlugins,
    sourcemap: !isProduction,
    output: isProduction ? [
        {
            format: 'umd',
            file: pkg["minified:main"].replace("preact", reactStr)
        }
    ] : [
        {
            format: 'umd',
            file: pkg.main.replace("preact", reactStr)
        },
        {
            format: 'es',
            file: pkg.module.replace("preact", reactStr)
        }
	]
}
