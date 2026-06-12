import os
import re

html_files = [
    'blogs.html', 'careers.html', 'description.html', 'contactUs.html',
    'Products.html', 'consultancy.html', 'index.html',
    'admin/login.html', 'admin/index.html'
]

supabase_script = '''  <!-- Supabase SDK -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="{prefix}assets/js/supabase-config.js"></script>'''

for f in html_files:
    path = os.path.join('/Users/fuadaslam/fuad/PLT-AG', f)
    if not os.path.exists(path): continue
    
    with open(path, 'r') as file:
        content = file.read()
    
    prefix = '../' if f.startswith('admin/') else ''
    new_script = supabase_script.format(prefix=prefix)
    
    # Replace Firebase blocks
    # We use regex to catch all firebase scripts and firebase-config
    pattern = r'<!-- Firebase SDKs -->.*?firebase-config\.js"></script>'
    # also handle cases where firebase-config is above the SDKs or below
    # admin/index.html has it weirdly
    content = re.sub(r'<!-- Firebase SDKs -->[\s\S]*?(?:firebase-config\.js"></script>|firebase-storage-compat\.js"></script>)', new_script, content)
    
    # specifically fix admin/index.html which had <script src="../assets/js/firebase-config.js"></script> before <!-- Firebase SDKs -->
    content = re.sub(r'<script src="\.\./assets/js/firebase-config\.js"></script>\s*' + re.escape(new_script), new_script, content)

    with open(path, 'w') as file:
        file.write(content)
    print(f"Updated {f}")
