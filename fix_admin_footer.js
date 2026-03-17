const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

// Find closing div of admin-screen
const oldEnd = '</div>\n\n<!-- MODAL -->';
const newEnd = `</div>

<!-- ADMIN FOOTER -->
<div style="text-align:center;padding:20px 16px;border-top:1px solid var(--gray-100);margin-top:8px">
  <a href="mailto:support@sosati.app" style="font-size:11px;color:var(--gray-400);text-decoration:none;letter-spacing:0.5px">support@sosati.app</a>
</div>

<!-- MODAL -->`;

if (c.includes(oldEnd)) {
  c = c.replace(oldEnd, newEnd);
  console.log('Footer added OK');
} else {
  console.log('Pattern not found');
  const idx = c.indexOf('<!-- MODAL -->');
  console.log('MODAL at line:', c.substring(0, idx).split('\n').length);
}

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
