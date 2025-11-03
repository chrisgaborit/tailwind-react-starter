#!/bin/bash

echo "🔍 Searching for incorrect StoryboardFormData imports..."

TARGET_PATH="./backend/src"

# Replace all incorrect imports with the correct one
grep -rl --exclude-dir="node_modules" "from '../types/storyboardTypes'" $TARGET_PATH | while read -r file; do
  echo "✏️ Fixing import in: $file"
  sed -i '' "s|from '../types/storyboardTypes'|from '../types/StoryboardFormData'|g" "$file"
done

echo "✅ All imports of StoryboardFormData have been corrected."

