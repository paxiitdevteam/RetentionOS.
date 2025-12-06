#!/bin/bash
# Script to update all HTML pages to use component system

PAGES=("about.html" "contact.html" "cookies.html" "integration.html" "pricing.html" "privacy.html" "terms.html")

for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "Updating $page..."
        
        # Replace header section (if exists)
        # This is a placeholder - actual replacement would need sed or similar
        
        # Replace footer section (if exists)
        # This is a placeholder - actual replacement would need sed or similar
    fi
done

echo "Done!"

