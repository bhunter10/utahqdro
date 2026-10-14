const { execFileSync } = require("node:child_process");
const { mkdirSync, mkdtempSync, rmSync } = require("node:fs");
const path = require("node:path");

// Keep compiled tests beneath node_modules so normal dependency resolution works.
const cache = path.join(__dirname, "../node_modules/.cache");
mkdirSync(cache, { recursive: true });
const output = mkdtempSync(path.join(cache, "document-tests-"));
try {
  execFileSync(process.execPath, [path.join(__dirname, "../node_modules/typescript/bin/tsc"),
    "tests/generated-documents.test.ts", "--outDir", output,
    "--module", "commonjs", "--target", "ES2022", "--esModuleInterop", "--skipLibCheck"
  ], { cwd: path.join(__dirname, ".."), stdio: "inherit" });
  execFileSync(process.execPath, ["--test", path.join(output, "tests/generated-documents.test.js"),
    path.join(__dirname, "../tests/generated-document-route.test.cjs")
  ], { stdio: "inherit" });
} finally {
  rmSync(output, { recursive: true, force: true });
}
