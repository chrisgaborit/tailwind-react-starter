#!/bin/bash

echo "🔍 Scanning backend for unsafe 'additionalNotes' usage..."

# Define path to backend
BACKEND_PATH="./backend/src"

# Find and patch lines that directly use `formData.additionalNotes` without optional chaining or fallback
grep -rl --exclude-dir="node_modules" "formData.additionalNotes" $BACKEND_PATH | while read -r file; do
  echo "✏️ Patching $file..."

  # Use sed to replace unsafe usage with fallback-safe pattern
  sed -i '' 's/formData.additionalNotes/formData.additionalNotes || "No additional creative guidance provided."/g' "$file"
done

echo "✅ All unsafe 'additionalNotes' references patched with fallback."

