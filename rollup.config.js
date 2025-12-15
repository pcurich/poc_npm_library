import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import copy from 'rollup-plugin-copy';


export default {
  input: 'src/index.ts',
  output: [
    { file: 'lib/index.cjs', format: 'cjs', sourcemap: true },
    { file: 'lib/index.esm.js', format: 'esm', sourcemap: true }
  ],
  plugins: [
    del({ targets: ['lib/*'] }),
    resolve({ extensions: ['.js', '.ts', '.tsx'] }),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
      tsconfigOverride: {
        compilerOptions: {
          declaration: false,
          emitDeclarationOnly: false,
          outDir: 'lib',
          module: 'ESNext'
        }
      },
      useTsconfigDeclarationDir: false,
      clean: true
    }),
    // Copiar el archivo http-mock-manager.js a lib/indexeddb/scripts/
    copy({
      targets: [
        { 
          src: 'src/indexeddb/scripts/http-mock-manager.js', 
          dest: 'lib/indexeddb/scripts' 
        }
      ],
      hook: 'closeBundle',
      copyOnce: true
    })
  ]
};