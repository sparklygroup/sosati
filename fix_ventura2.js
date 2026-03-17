const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

c = c.replace(/ventura:'Ventura Blvd'/g, "ventura:'Cesar Chavez'");
c = c.replace(/ventura: 'Ventura Blvd'/g, "ventura: 'Cesar Chavez'");

const remaining = (c.match(/Ventura Blvd/g) || []).length;
console.log('Ventura Blvd remaining:', remaining);

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('Done');
