const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

const adminCalJS = `
function switchCitasView(view) {
  var isCal = view === 'cal';
  document.getElementById('admin-cal-view').style.display = isCal ? 'block' : 'none';
  document.getElementById('admin-list-view').style.display = isCal ? 'none' : 'block';
  document.getElementById('subtab-cal').classList.toggle('active', isCal);
  document.getElementById('subtab-list').classList.toggle('active', !isCal);
  if (isCal) renderAdminCalendar();
}

function renderAdminCalendar() {
  var grid = document.getElementById('cal-grid-admin');
  var labelEl = document.getElementById('cal-week-label-admin');
  if (!grid) return;

  var days = calGetWeekDates(calWeekOffset);
  var todayStr = SOSATI.utils.todayStr();
  var all = SOSATI.storage.getAll();
  var locEl = document.getElementById('cal-loc');
  var filterLoc = locEl ? locEl.value : '';
  if (filterLoc) all = all.filter(function(a){ return a.location === filterLoc; });

  var MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var DAYS = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
  var locColors = { belmont:'var(--brand)', ventura:'#7c3aed', kings:'#06b6d4' };
  var locNames = { belmont:'Belmont', ventura:'Ventura', kings:'Kings' };

  if (labelEl) {
    var f = days[0], l = days[4];
    var lbl = f.getDate() + ' ' + MONTHS[f.getMonth()];
    if (f.getMonth() !== l.getMonth()) lbl += ' - ' + l.getDate() + ' ' + MONTHS[l.getMonth()];
    else lbl += ' - ' + l.getDate();
    lbl += ' ' + f.getFullYear();
    labelEl.textContent = lbl;
  }

  grid.innerHTML = days.map(function(day) {
    var ds = day.getFullYear() + '-' + String(day.getMonth()+1).padStart(2,'0') + '-' + String(day.getDate()).padStart(2,'0');
    var isToday = ds === todayStr;
    var dayAppts = all.filter(function(a){ return a.date === ds; })
      .sort(function(a,b){ return a.time.localeCompare(b.time); });

    var cards = dayAppts.length ? dayAppts.map(function(a) {
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
    }).join('') : '<div style="font-size:11px;color:#d1d5db;text-align:center;padding:16px 0;font-style:italic">Sin citas</div>';

    var count = dayAppts.length;
    var headerStyle = 'padding:10px 8px 8px;text-align:center;background:' + (isToday ? '#f5f3ff' : '#fff') + ';border-bottom:2px solid #f3f4f6';
    var numStyle = 'font-size:20px;font-weight:700;font-family:var(--font-display);line-height:1.2;' + (isToday ? 'color:#fff;background:var(--brand);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;font-size:16px' : 'color:var(--brand)');

    return '<div style="border-right:1px solid #f3f4f6;min-width:100px">' +
      '<div style="' + headerStyle + '">' +
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#9ca3af">' + DAYS[day.getDay()] + '</div>' +
        '<div style="' + numStyle + '">' + day.getDate() + '</div>' +
      '</div>' +
      '<div style="padding:8px 6px;min-height:200px">' + cards + '</div>' +
      '<div style="padding:8px;border-top:2px solid #f3f4f6;text-align:center;background:#f9fafb">' +
        '<div style="font-size:11px;font-weight:700;color:var(--brand)">' + (count ? count + ' cita' + (count!==1?'s':'') : 'Sin citas') + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}
`;

// Insert before showToast
if (c.includes('function showToast')) {
    c = c.replace('function showToast', adminCalJS + '\nfunction showToast');
    console.log('JS added OK');
} else {
    console.log('showToast not found');
    process.exit(1);
}

// Update renderAll to call renderAdminCalendar
c = c.replace(
    'updateStats();\n  renderList();',
    'updateStats();\n  renderList();\n  if (SOSATI.auth.isAdmin()) renderAdminCalendar();'
);

// Init calendar on load
c = c.replace(
    'if (SOSATI.auth.isAdmin()) renderDashboard();',
    'if (SOSATI.auth.isAdmin()) { renderDashboard(); renderAdminCalendar(); }'
);

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('Saved OK');
