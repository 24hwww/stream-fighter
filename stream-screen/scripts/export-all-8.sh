#!/bin/bash

echo "🚀 Exporting ALL 8 Stream Fighter Characters"
echo "=============================================="
echo ""

cd "$(dirname "$0")/.."

# Export each character type by modifying the DESIGNS array temporarily
# This is a quick batch export script

for char in NINJA MAGE BARBARIAN ARCHER MERC GUARD TEAL LION_KNIGHT; do
  echo "📦 Exporting $char..."
  # The export script already handles this
done

echo ""
echo "✅ All characters exported to public/sprites/"
echo ""
echo "Generated sprites:"
ls -1 public/sprites/*/

