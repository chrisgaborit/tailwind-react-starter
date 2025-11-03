// upload-storyboards.js

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DIR = '/Users/chris/JSON Files eLearning'; // ← Change if your folder path differs

fs.readdirSync(DIR).forEach(file => {
  if (!file.endsWith('.json')) return; // Only process JSON files

  const content = fs.readFileSync(path.join(DIR, file), 'utf8');
  let json;
  try {
    json = JSON.parse(content);
  } catch (e) {
    console.error(`❌ Error parsing ${file}:`, e.message);
    return;
  }

  axios.post('http://localhost:8080/api/storyboards', {
    content: json,
    tags: json.tags || ['Imported', 'Best'],
    level: json.level || 2,
    isBestExample: true,
    createdBy: 'chris@learno.com'
  })
  .then(res => console.log(`✅ ${file}: Uploaded`))
  .catch(err => {
    const msg = err.response?.data || err.message;
    console.error(`❌ ${file}: Upload failed`, msg);
  });
});
