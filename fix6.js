const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html','utf8');

// Find and fix the onclick on line 1867
const bad = "onclick=\"openApptDetail('' + a.id + '')\"";
const good = "onclick=\"openApptDetail('\" + a.id + \"')\"";

if (c.includes(bad)) {
    c = c.replace(bad, good);
    console.log('Fixed!');
} else {
    // Try to find what's actually there
    const idx = c.indexOf('openApptDetail(');
    if (idx >= 0) {
        console.log('Found at:', idx);
        console.log(JSON.stringify(c.substring(idx-10, idx+50)));
    } else {
        console.log('Not found at all');
    }
}

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
