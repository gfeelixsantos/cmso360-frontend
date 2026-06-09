path = r'app/recepcao/components/AtendimentoModal.tsx'
with open(path, 'rb') as f:
    raw = f.read()

# The fix:
# 1. Add outer opener before <div className="mt-4"> (before line 1775)
# 2. Remove inner duplicate {isBindServiceSelected && ( (line 1776) and its )} (line 1805)
# 3. Fix indentation of inner content (remove 2 spaces from lines 1777-1804)
# 4. The </div> at line 1806 (18 spaces) becomes the closing of mt-4 div at 16 spaces

# Step by step byte operations:
lines = raw.split(b'\r\n')

# Line index (0-based): 1774=line1775, 1775=line1776, 1804=line1805
# Add "{isBindServiceSelected && (\r\n" before current line 1775 (index 1774)
new_opener = b'                {isBindServiceSelected && ('

# Remove line 1776 (index 1775): b'                  {isBindServiceSelected && ('
# Remove line 1805 (index 1804): b'                  )}'

# Fix indentation of lines 1777-1804 (index 1776-1803): remove 2 leading spaces
# Fix line 1806 (index 1805): b'                  </div>' -> b'                </div>'

result = []
skip_indices = {1775, 1804}  # lines to remove (0-based)

for i, line in enumerate(lines):
    if i == 1774:
        # Insert opener before <div className="mt-4"> line
        result.append(new_opener)
        result.append(line)
    elif i in skip_indices:
        # Skip duplicate condition opener/closer
        pass
    elif 1776 <= i <= 1803:
        # Remove 2 leading spaces from inner content
        if line.startswith(b'  '):
            result.append(line[2:])
        else:
            result.append(line)
    elif i == 1805:
        # Fix </div> indentation from 18 to 16 spaces
        result.append(b'                </div>')
    else:
        result.append(line)

fixed = b'\r\n'.join(result)
with open(path, 'wb') as f:
    f.write(fixed)

print(f'Done! Lines: {len(lines)} -> {len(result)}')

# Verify fix - show lines around the fix
for i in range(1773, 1815):
    text = result[i].decode('utf-8', errors='replace')
    print(f" {i+1:4d}: {text}")
