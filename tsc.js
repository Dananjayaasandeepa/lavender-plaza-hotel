const ts = require("/home/claude/.npm-global/lib/node_modules/typescript");
const fs = require("fs");
const src = fs.readFileSync("app.src.jsx", "utf8");
const out = ts.transpileModule(src, { reportDiagnostics: true, fileName: "app.tsx", compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2019, removeComments: true } });
if (out.diagnostics.length) { for (const d of out.diagnostics) console.log("DIAG", ts.flattenDiagnosticMessageText(d.messageText, "\n")); process.exit(1); }
fs.writeFileSync("app.js", "(function(){\n\"use strict\";\n" + out.outputText + "\n})();\n");
console.log("app.js", fs.statSync("app.js").size);
