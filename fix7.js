const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html','utf8');

const bad = "onclick=\"openApptDetail(\\'' + a.id + '\\')\">";
const good = "onclick=\"openApptDetail('\" + a.id + \"')\">";

if (c.includes(bad)) {
    c = c.replace(bad, good);
    console.log('Fixed!');
} else {
    console.log('Pattern not found, trying bytes...');
    console.log(JSON.stringify(c.substring(68285, 68340)));
}

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
