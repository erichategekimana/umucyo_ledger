import re

filepath = '/home/eric/working_space/umucyo_ledger/frontend/src/components/layouts/Sidebar.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Remove any line that contains ROUTES.NOTIFICATIONS
new_content = re.sub(r'^\s*\{\s*to:\s*ROUTES\.NOTIFICATIONS.*\},?\n', '', content, flags=re.MULTILINE)

with open(filepath, 'w') as f:
    f.write(new_content)
print("Cleaned Sidebar.tsx")
