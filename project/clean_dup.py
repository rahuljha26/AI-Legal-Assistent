with open('generate_blackbook.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find line 534 (0-indexed: 533) which is the end of the new block `    ]`
# and line 704 (0-indexed: 703) which is `    ]` end of old block
# Lines 535-705 (1-indexed) = indices 534-704 (0-indexed) need to be removed
# We keep lines up to and including line 534, skip to line 706

new_lines = lines[:534] + ['\n'] + lines[705:]

with open('generate_blackbook.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Done. New file has {len(new_lines)} lines.")
