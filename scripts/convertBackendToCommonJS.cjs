const fs = require("fs");
const path = require("path");
const glob = require("glob");

const files = glob.sync(path.join(__dirname, "../backend/src/**/*.{ts,js}"));

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  let updated = content;

  // Ignore type-only imports (they don't need require)
  updated = updated.replace(
    /^import\s+type\s+.*?;?\n?/gm,
    ""
  );

  // Convert default + named imports to require (multi-line safe)
  updated = updated.replace(
    /^import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?/gm,
    (match, vars, mod) => {
      if (vars.includes("{")) {
        return `const ${vars} = require('${mod}');`;
      }
      return `const ${vars.trim()} = require('${mod}');`;
    }
  );

  // Convert dynamic imports
  updated = updated.replace(
    /await\s+import\(([^)]+)\)/g,
    "require($1) /* CHECK: dynamic import */"
  );

  // Convert export default
  updated = updated.replace(
    /^export\s+default\s+/gm,
    "module.exports = "
  );

  // Convert named exports
  updated = updated.replace(
    /^export\s+const\s+([a-zA-Z0-9_]+)\s+=/gm,
    "exports.$1 ="
  );

  if (updated !== content) {
    console.log(`✅ Updated: ${file}`);
    fs.writeFileSync(file, updated, "utf8");
  }
});