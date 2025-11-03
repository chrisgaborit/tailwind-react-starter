#!/bin/bash

echo "Creating src directory if it doesn't exist..."
mkdir -p src

for folder in db models routes types utils services controllers; do
  if [ -d "$folder" ]; then
    echo "Moving $folder to src/$folder"
    mv "$folder" "src/$folder"
  fi
done

echo "All done! Please check your /src directory."
