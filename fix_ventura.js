const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

// Replace all Ventura references
const replacements = [
  ['Ventura Blvd</button>', 'Cesar Chavez</button>'],
  ['"office-name">Ventura Blvd<', '"office-name">Cesar Chavez<'],
  ['"office-address">3259 E. Ventura Blvd<', '"office-address">3259 E Cesar Chavez Blvd<'],
  ['>Ventura</option>', '>Cesar Chavez</option>'],
  ['>Ventura Blvd</option>', '>Cesar Chavez</option>'],
  ['ventura:"Ventura Blvd"', 'ventura:"Cesar Chavez"'],
  ['"ventura" ? "Ventura"', '"ventura" ? "Cesar Chavez"'],
];

let count = 0;
replacements.forEach(([old, nw]) => {
  if (c.includes(old)) { c = c.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), nw); count++; }
});

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('Replacements:', count);

// Verify
const remaining = (c.match(/Ventura Blvd/g) || []).length;
console.log('Ventura Blvd remaining:', remaining);
