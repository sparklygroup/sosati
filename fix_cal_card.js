const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

// Find exact cal card onclick pattern
const idx = c.indexOf("cal-appt-card");
console.log('Sample around cal-appt-card:', JSON.stringify(c.substring(idx, idx+200)));
