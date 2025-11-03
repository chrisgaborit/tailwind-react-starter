const fs = require("fs");
const path = require("path");
const glob = require("glob");

const files = glob.sync("src/**/*.{ts,js}");

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  let updated = content;

  // Convert import statements
  updated = updated.replace(
    /^import\s+([a-zA-Z0-9_{}*,\s]+)\s+from\s+['"]([^'"]+)['"];?/gm,
    (match, vars, mod) => {
      if (vars.includes("{")) {
        return `const ${vars} = require('${mod}');`;
      } else {
        return `const ${vars} = require('${mod}');`;
      }
    }
  );

  // Convert dynamic import
  updated = updated.replace(
    /await\s+import\(([^)]+)\)/g,
    "require($1) /* CHECK: converted from dynamic import */"
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