const fs = require('fs');
const path = require('path');

const DIR = '/Users/chris/JSON Files eLearning'; // Update if needed

fs.readdirSync(DIR).forEach(file => {
  if (!file.endsWith('.json')) return;

  const fullPath = path.join(DIR, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  let arr;
  try {
    arr = JSON.parse(content);
    if (!Array.isArray(arr)) {
      console.log(`Skipping ${file}: already in object format.`);
      return;
    }
  } catch (e) {
    console.error(`❌ Error parsing ${file}:`, e.message);
    return;
  }
  // Extract common fields from the first item
  const meta = arr[0];
  const obj = {
    moduleName: meta.moduleName || file.replace('.json',''),
    duration: meta.duration || '',
    moduleType: meta.moduleType || '',
    interactivityLevel: meta.interactivityLevel || '',
    pages: arr
  };
  // Save as new file (or overwrite)
  fs.writeFileSync(fullPath, JSON.stringify(obj, null, 2));
  console.log(`✅ Fixed format for: ${file}`);
});
