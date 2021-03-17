import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import typescript from 'rollup-plugin-typescript2';
import packageJson from './package.json';

const config = {
    input: './src/index.ts',
    output: [
        {
            file: packageJson.main,
            format: 'cjs',
            sourcemap: false,
        },
        {
            file: packageJson.module,
            format: 'esm',
            sourcemap: false,
        },
    ],
    plugins: [
        peerDepsExternal(),
        resolve(),
        commonjs(),
        typescript({
            tsconfig: 'tsconfig.build.json',
        }),
    ],
};

export default config;
