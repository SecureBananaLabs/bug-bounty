cd "$(dirname "$0")/../apps/api/src/controllers"

for f in *.js; do
  # Add import to each controller file
  if ! grep -q "asyncHandler" "$f"; then
    # Check if file has async functions
    if grep -q "async function" "$f"; then
      # Add import at top
      sed -i '1i import { asyncHandler } from "../utils/asyncHandler.js";' "$f"
      # Wrap each async function: change "export async function NAME" to "export const NAME = asyncHandler(async "
      # and adjust closing
      echo "Updated: $f"
    fi
  fi
done
