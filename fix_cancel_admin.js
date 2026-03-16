const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

// 1. Fix cancelled color - orange/coral instead of red, both CSS blocks
c = c.replace(
  /\.cal-appt-card\.status-cancelled \{ border-left-color:#ef4444; background:#fef2f2; opacity:0\.6; \}/g,
  '.cal-appt-card.status-cancelled { border-left-color:#f97316; background:#fff7ed; opacity:0.85; text-decoration:line-through; }'
);

// 2. Replace openApptDetail with full version including cancel button
const oldDetail = `function openApptDetail(id) {
  var all = SOSATI.storage.getAll();
  var a = all.find(function(x){ return x.id === id; });
  if (!a) return;
  showModal(
    a.name + ' — ' + a.time,
    a.serviceLabel + ' · ' + SOSATI.utils.formatDate(a.date),
    function() { changeStatus(a.id, 'confirmed'); }
  );
}`;

const newDetail = `function openApptDetail(id) {
  var all = SOSATI.storage.getAll();
  var a = all.find(function(x){ return x.id === id; });
  if (!a) return;

  var statusLabels = { pending:'Pendiente', confirmed:'Confirmada', completed:'Completada', cancelled:'Cancelada' };
  var statusColors = { pending:'#f59e0b', confirmed:'#10b981', completed:'#6366f1', cancelled:'#f97316' };
  var sColor = statusColors[a.status] || '#9ca3af';
  var sLabel = statusLabels[a.status] || a.status;

  var body = '<div style="font-size:13px;color:#6b7280;margin-bottom:12px">' +
    '<div style="margin-bottom:6px"><strong style="color:#1f2937">' + a.serviceLabel + '</strong></div>' +
    '<div>' + SOSATI.utils.formatDate(a.date) + ' · ' + a.time + '</div>' +
    '<div style="margin-top:6px">' + (a.locationLabel || '') + '</div>' +
    '<div style="margin-top:8px;display:inline-block;padding:3px 12px;border-radius:99px;background:' + sColor + '20;color:' + sColor + ';font-weight:700;font-size:12px">' + sLabel + '</div>' +
  '</div>' +
  '<div style="display:flex;gap:8px;margin-top:4px">' +
    (a.status !== 'confirmed' ? '<button onclick="changeStatus(\'' + a.id + '\',\'confirmed\');closeModal()" style="flex:1;background:#10b981;border:none;border-radius:8px;padding:10px;color:#fff;font-weight:600;font-size:13px;cursor:pointer">Confirmar</button>' : '') +
    (a.status !== 'cancelled' ? '<button onclick="cancelAppt(\'' + a.id + '\')" style="flex:1;background:#f97316;border:none;border-radius:8px;padding:10px;color:#fff;font-weight:600;font-size:13px;cursor:pointer">Cancelar cita</button>' : '') +
  '</div>';

  showModal(a.name + ' · ' + a.time, body, null);
}

async function cancelAppt(id) {
  if (!confirm('¿Cancelar esta cita?')) return;
  await changeStatus(id, 'cancelled');
  closeModal();
  showToast('Cita cancelada', 'success');
  renderAll();
  if (SOSATI.auth.isAdmin()) renderAdminCalendar();
  else renderCalendar();
}`;

if (c.includes(oldDetail)) {
  c = c.replace(oldDetail, newDetail);
  console.log('openApptDetail replaced OK');
} else {
  console.log('openApptDetail NOT FOUND');
}

// 3. Also update admin calendar cards to show status class
const oldCalCard = "return '<div class=\"cal-appt-card ' + statusClass + '\" onclick=\"openApptDetail(\\'' + a.id + '\\')'";
const newCalCard = "return '<div class=\"cal-appt-card ' + statusClass + '\" data-id=\"' + a.id + '\" onclick=\"openApptDetail(this.dataset.id)'";

if (c.includes(oldCalCard)) {
  c = c.replace(oldCalCard, newCalCard);
  console.log('Cal card onclick OK');
} else {
  console.log('Cal card pattern not found - checking...');
  const idx = c.indexOf('cal-appt-card');
  console.log('cal-appt-card at:', idx);
}

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('Saved');
