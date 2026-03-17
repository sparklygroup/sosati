const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

const oldCard = `      div.innerHTML = '<div style="font-size:10px;color:#9ca3af;font-weight:600">' + a.time + locLabel + '</div>' +
        '<div style="font-size:12px;font-weight:700;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + a.name + '</div>' +
        '<div style="font-size:10.5px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (a.serviceLabel || '') + '</div>';
      return div.outerHTML;`;

const newCard = `      var isCancelled = a.status === 'cancelled';
      var cancelTag = isCancelled ? ' <span style="color:#ea580c;font-weight:800;font-size:9px">CANCELADA</span>' : '';
      div.style.cssText = 'background:' + (isCancelled ? '#fff7ed' : '#f5f3ff') + ';border-left:' + (isCancelled ? '4px' : '3px') + ' solid ' + (isCancelled ? '#ea580c' : color) + ';border-radius:6px;padding:6px 8px;cursor:pointer;margin-bottom:4px';
      div.innerHTML = '<div style="font-size:10px;color:#9ca3af;font-weight:600">' + a.time + locLabel + cancelTag + '</div>' +
        '<div style="font-size:12px;font-weight:700;color:' + (isCancelled ? '#ea580c' : '#1f2937') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' + (isCancelled ? 'text-decoration:line-through' : '') + '">' + a.name + '</div>' +
        '<div style="font-size:10.5px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (a.serviceLabel || '') + '</div>';
      return div.outerHTML;`;

if (c.includes(oldCard)) {
  c = c.replace(oldCard, newCard);
  console.log('OK - cancelled style added');
} else {
  console.log('NOT FOUND');
}

// Also fix CSS opacity
c = c.replace(
  '.cal-appt-card.status-cancelled { border-left-color:#ef4444; background:#fef2f2; opacity:0.6; }',
  '.cal-appt-card.status-cancelled { border-left-color:#ea580c; background:#fff7ed; border-left-width:4px; }'
);
c = c.replace(
  '.cal-appt-card.status-cancelled { border-left-color:#ef4444;background:#fef2f2;opacity:0.6; }',
  '.cal-appt-card.status-cancelled { border-left-color:#ea580c;background:#fff7ed;border-left-width:4px; }'
);

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('Saved');
