
import re

file_path = 'src/components/Dashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
removed_count = 0

# Patterns to match alerts with success symbols
alert_pattern = re.compile(r'^\s*alert\(isRtl \? (["\'])(✓|🎉|✅).*?\1 : (["\']).*?\3\);?\s*$')
# Also handle some variations
alert_pattern_simple = re.compile(r'^\s*alert\(.*(✓|🎉|✅).*\);?\s*$')

for line in lines:
    if alert_pattern_simple.search(line):
        removed_count += 1
        continue
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Removed {removed_count} alert calls.")
