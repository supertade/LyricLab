#!/bin/bash

# Create icons directory if it doesn't exist
mkdir -p public/icons

# Define the icon sizes needed according to manifest.json
SIZES=(72 96 128 144 152 192 384 512)

# Source SVG file
SVG_FILE="public/icon.svg"

# Check if the source file exists
if [ ! -f "$SVG_FILE" ]; then
  echo "Error: Source file $SVG_FILE not found"
  exit 1
fi

# Generate icons for each size
for size in "${SIZES[@]}"; do
  OUTPUT_FILE="public/icons/icon-${size}x${size}.png"
  echo "Generating $OUTPUT_FILE..."
  
  # Use ImageMagick to convert SVG to PNG
  convert -background none -size ${size}x${size} "$SVG_FILE" "$OUTPUT_FILE"
  
  # Check if the conversion was successful
  if [ $? -eq 0 ]; then
    echo "✓ Created $OUTPUT_FILE"
  else
    echo "✗ Failed to create $OUTPUT_FILE"
  fi
done

echo "Icon generation complete!"
echo "Generated icons for manifest.json in public/icons/" 