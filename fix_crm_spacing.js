const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

// Find crm-table CSS
const idx = c.indexOf('.crm-table');
console.log('crm-table at:', idx);
if (idx >= 0) console.log(c.substring(idx, idx+300));
