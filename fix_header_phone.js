const fs = require('fs');

// Fix sosati-style.css - header width and no radius
let css = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-style.css', 'utf8');

// Remove border-radius from header, add max-width
css = css.replace(
  'border-radius: 16px 16px 0 0;\n  margin: 0 0 0 0;',
  'border-radius: 0;\n  max-width: 480px;\n  margin: 0 auto;'
);

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-style.css', css);
console.log('CSS OK:', css.includes('max-width: 480px') ? 'YES' : 'NO');

// Fix sosati-appointment.html
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-appointment.html', 'utf8');

// 1. Remove border-radius from header inline style
c = c.replace(
  'style="align-items:flex-start;padding:16px 16px 14px;border-radius:20px 20px 0 0"',
  'style="align-items:flex-start;padding:16px 16px 14px"'
);

// 2. Smaller powered by
c = c.replace(
  'font-size:11px;opacity:0.55;',
  'font-size:9px;opacity:0.4;'
);

// 3. Phone format on cancel input
c = c.replace(
  'id="cancel-phone" placeholder="(559) 000-0000" style="margin-bottom:8px"',
  'id="cancel-phone" placeholder="559 000 0000" oninput="formatCancelPhone(this)" inputmode="tel" style="margin-bottom:8px"'
);

// 4. Add formatCancelPhone before _foundAppt
if (!c.includes('formatCancelPhone')) {
  c = c.replace(
    'var _foundAppt = null;',
    `function formatCancelPhone(e) {
        var d = e.value.replace(/\\D/g,"").substring(0,10);
        if (d.length > 6) e.value = d.slice(0,3)+" "+d.slice(3,6)+" "+d.slice(6);
        else if (d.length > 3) e.value = d.slice(0,3)+" "+d.slice(3);
        else e.value = d;
      }
      var _foundAppt = null;`
  );
}

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-appointment.html', c);
console.log('HTML OK');
console.log('formatCancelPhone:', c.includes('formatCancelPhone') ? 'YES' : 'NO');
console.log('cancelar functions:', c.includes('searchAndCancel') ? 'YES' : 'NO');
