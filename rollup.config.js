import typescript from "rollup-plugin-typescript2";
import del from "rollup-plugin-delete";

export default {
    input: "src/index.ts",
    output: [
        {
            format: "cjs",
            file: "lib/index.cjs",
        }, 
        {
            file: "lib/index.esm.js",
            format: "esm",
        }
    ],
    plugins: [
        del({ targets: ["lib/*"] }),
        typescript({ useTsconfigDeclarationDir: true })
    ]
};