const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html','utf8');

// Fix both onclick patterns by using data-id + no inline quotes
// Pattern on line 1701 (secretary)
c = c.replace(
    '" onclick="openApptDetail(\'" + a.id + "\')">\' +',
    '" data-appt-id=\'" + a.id + "\'" onclick="openApptDetail(this.dataset.apptId)">\' +'
);

// Pattern on line 1867 (admin)  
c = c.replace(
    '" onclick="openApptDetail(\'" + a.id + "\')">' ,
    '" data-appt-id=\'" + a.id + "\'" onclick="openApptDetail(this.dataset.apptId)">'
);

const count = c.split('openApptDetail(\'').length - 1;
console.log('Remaining bad patterns:', count);
console.log('openApptDetail occurrences:', (c.match(/openApptDetail/g)||[]).length);

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
