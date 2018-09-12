const rollupTypescript = require('rollup-typescript')
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
    external: external,
    plugins: basePlugins,
    output: isProduction ? [
        {
            name: 'animate',
            sourcemap: !isProduction,
            globals: globals,
            format: 'umd',
            file: pkg["minified:main"].replace("preact", reactStr)
        }
    ] : [
        {
            name: 'animate',
            sourcemap: !isProduction,
            globals: globals,
            format: 'umd',
            file: pkg.main.replace("preact", reactStr)
        },
        {
            name: 'animate',
            sourcemap: !isProduction,
            globals: globals,
            format: 'es',
            file: pkg.module.replace("preact", reactStr)
        }
	]
}
