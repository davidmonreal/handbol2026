#!/bin/bash
# Script to replace all localhost:3000 references with API_BASE_URL

cd "$(dirname "$0")"

# Files to update
FILES=(
  "src/context/MatchContext.tsx"
  "src/components/Dashboard.tsx"
  "src/components/MatchTracker.tsx"
 "src/components/Statistics.tsx"
  "src/components/admin/ClubsManagement.tsx"
  "src/components/admin/PlayersManagement.tsx"
  "src/components/admin/SeasonsManagement.tsx"
  "src/components/admin/MatchesManagement.tsx"
  "src/components/admin/TeamsManagement.tsx"
)

for file in "${FILES[@]}"; do
  echo "Processing $file..."
  
  # Add import if not present
  if ! grep -q "import { API_BASE_URL }" "$file"; then
    # Add import after existing imports
    sed -i '' "1s/^/import { API_BASE_URL } from '..\/..\/config\/api';\n/" "$file" 2>/dev/null || \
    sed -i '' "1s/^/import { API_BASE_URL } from '..\/config\/api';\n/" "$file" 2>/dev/null || \
    sed -i '' "1s/^/import { API_BASE_URL } from '..\/..\/..\/config\/api';\n/" "$file"
  fi
  
  # Replace all localhost URLs
  sed -i '' "s|'http://localhost:3000|\`\${API_BASE_URL}|g" "$file"
  sed -i '' 's|`http://localhost:3000|`${API_BASE_URL}|g' "$file"
done

echo "Done!"
