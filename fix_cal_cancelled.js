const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

// 1. Fix cancelled color in both CSS blocks - more visible orange + CANCELADA label
c = c.replace(
  '.cal-appt-card.status-cancelled { border-left-color:#ef4444; background:#fef2f2; opacity:0.6; }',
  '.cal-appt-card.status-cancelled { border-left-color:#ea580c; background:#fff7ed; border-left-width:4px; }'
);
c = c.replace(
  '.cal-appt-card.status-cancelled { border-left-color:#ef4444;background:#fef2f2;opacity:0.6; }',
  '.cal-appt-card.status-cancelled { border-left-color:#ea580c;background:#fff7ed;border-left-width:4px; }'
);

// 2. Fix renderAdminCalendar cards to use statusClass and show CANCELADA label
const oldCard = `      var cards = dayAppts.length ? dayAppts.map(function(a) {
      var color = locColors[a.location] || 'var(--brand)';
      var locLabel = !filterLoc ? (' · ' + (locNames[a.location] || '')) : '';
      var div = document.createElement('div');
      div.style.cssText = 'background:#f5f3ff;border-left:3px solid ' + color + ';border-radius:6px;padding:6px 8px;cursor:pointer;margin-bottom:4px';
      div.dataset.id = a.id;
      div.onclick = function(){ openApptDetail(this.dataset.id); };
      div.innerHTML = '<div style="font-size:10px;color:#9ca3af;font-weight:600">' + a.time + locLabel + '</div>' +
        '<div style="font-size:12px;font-weight:700;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + a.name + '</div>' +
        '<div style="font-size:10.5px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (a.serviceLabel || '') + '</div>';
      return div.outerHTML;
    }).join('') :`;

const newCard = `      var cards = dayAppts.length ? dayAppts.map(function(a) {
      var color = a.status === 'cancelled' ? '#ea580c' : (locColors[a.location] || 'var(--brand)');
      var locLabel = !filterLoc ? (' · ' + (locNames[a.location] || '')) : '';
      var isCancelled = a.status === 'cancelled';
      var div = document.createElement('div');
      div.style.cssText = 'background:' + (isCancelled ? '#fff7ed' : '#f5f3ff') + ';border-left:' + (isCancelled ? '4px' : '3px') + ' solid ' + color + ';border-radius:6px;padding:6px 8px;cursor:pointer;margin-bottom:4px';
      div.dataset.id = a.id;
      div.onclick = function(){ openApptDetail(this.dataset.id); };
      div.innerHTML = '<div style="font-size:10px;color:#9ca3af;font-weight:600">' + a.time + locLabel + (isCancelled ? ' · <span style=\\'color:#ea580c;font-weight:700\\'>CANCELADA</span>' : '') + '</div>' +
        '<div style="font-size:12px;font-weight:700;color:' + (isCancelled ? '#ea580c' : '#1f2937') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis' + (isCancelled ? ';text-decoration:line-through' : '') + '">' + a.name + '</div>' +
        '<div style="font-size:10.5px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (a.serviceLabel || '') + '</div>';
      return div.outerHTML;
    }).join('') :`;

if (c.includes(oldCard)) {
  c = c.replace(oldCard, newCard);
  console.log('Admin calendar cards updated OK');
} else {
  console.log('Admin card pattern not found');
}

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('Done');
