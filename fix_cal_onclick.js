const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

const bad = "onclick=\"openApptDetail(\\'' + a.id + '\\')\">'+";
const good = "onclick=\"openApptDetail(this.dataset.id)\" data-id=\"' + a.id + '\">'+";

// Also try with space
const bad2 = "onclick=\"openApptDetail(\\'' + a.id + '\\')\">' +";
const good2 = "onclick=\"openApptDetail(this.dataset.id)\" data-id=\"' + a.id + '\">'+";

let count = 0;
while (c.includes(bad)) { c = c.replace(bad, good); count++; }
while (c.includes(bad2)) { c = c.replace(bad2, good2); count++; }

console.log('Replacements:', count);
fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('Saved');
