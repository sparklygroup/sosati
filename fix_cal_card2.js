const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

// Find onclick openApptDetail in cal cards
const idx = c.indexOf('openApptDetail(');
console.log('First openApptDetail at char:', idx);
console.log(JSON.stringify(c.substring(idx-50, idx+80)));

const idx2 = c.indexOf('openApptDetail(', idx+1);
console.log('Second at:', idx2);
if (idx2 > 0) console.log(JSON.stringify(c.substring(idx2-50, idx2+80)));
