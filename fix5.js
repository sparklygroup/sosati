const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html','utf8');

const adminCalJS = `
// ADMIN CALENDAR VIEW
function switchCitasView(view) {
  var isCalView = view === 'cal';
  document.getElementById('admin-cal-view').style.display = isCalView ? 'block' : 'none';
  document.getElementById('admin-list-view').style.display = isCalView ? 'none' : 'block';
  document.getElementById('subtab-cal').classList.toggle('active', isCalView);
  document.getElementById('subtab-list').classList.toggle('active', !isCalView);
  if (isCalView) renderAdminCalendar();
}

function renderAdminCalendar() {
  var days = calGetWeekDates(calWeekOffset);
  var todayStr = SOSATI.utils.todayStr();
  var all = SOSATI.storage.getAll();
  var locFilter = document.getElementById('cal-filter-location');
  var filterLoc = locFilter ? locFilter.value : '';
  if (filterLoc) all = all.filter(function(a){ return a.location === filterLoc; });

  var locColors = { belmont:'var(--brand)', ventura:'#7c3aed', kings:'#06b6d4' };
  var locNames = { belmont:'Belmont', ventura:'Ventura', kings:'Kings' };

  // Update week label
  var first = days[0], last = days[4];
  var MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var label = first.getDate() + ' ' + MONTHS[first.getMonth()];
  if (first.getMonth() !== last.getMonth()) label += ' - ' + last.getDate() + ' ' + MONTHS[last.getMonth()];
  else label += ' - ' + last.getDate();
  label += ' ' + first.getFullYear();
  var labelEl = document.getElementById('cal-week-label-admin');
  if (labelEl) labelEl.textContent = label;

  var DAYS = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
  var grid = document.getElementById('cal-grid-admin');
  if (!grid) return;

  grid.innerHTML = days.map(function(day) {
    var ds = day.getFullYear() + '-' + String(day.getMonth()+1).padStart(2,'0') + '-' + String(day.getDate()).padStart(2,'0');
    var isToday = ds === todayStr;
    var dayAppts = all.filter(function(a){ return a.date === ds; })
      .sort(function(a,b){ return a.time.localeCompare(b.time); });

    var cards = dayAppts.length ? dayAppts.map(function(a) {
      var color = locColors[a.location] || 'var(--brand)';
      var locLabel = !filterLoc ? (' - ' + (locNames[a.location] || '')) : '';
      return '<div style="background:#f5f3ff;border-left:3px solid ' + color + ';border-radius:6px;padding:6px 8px;cursor:pointer;margin-bottom:4px" onclick="openApptDetail(\'' + a.id + '\')">' +
        '<div style="font-size:10px;color:#9ca3af;font-weight:600">' + a.time + locLabel + '</div>' +
        '<div style="font-size:12px;font-weight:700;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + a.name + '</div>' +
        '<div style="font-size:10.5px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (a.serviceLabel || '') + '</div>' +
      '</div>';
    }).join('') : '<div style="font-size:11px;color:#d1d5db;text-align:center;padding:16px 0;font-style:italic">Sin citas</div>';

    var count = dayAppts.length;
    return '<div style="border-right:1px solid #f3f4f6;min-width:100px">' +
      '<div style="padding:10px 8px 8px;text-align:center;background:#fff;border-bottom:2px solid #f3f4f6' + (isToday ? ';background:#f5f3ff' : '') + '">' +
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#9ca3af">' + DAYS[day.getDay()] + '</div>' +
        '<div style="font-size:20px;font-weight:700;color:var(--brand);font-family:var(--font-display);line-height:1.2' + (isToday ? ';background:var(--brand);color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;font-size:16px' : '') + '">' + day.getDate() + '</div>' +
      '</div>' +
      '<div style="padding:8px 6px;min-height:200px">' + cards + '</div>' +
      '<div style="padding:8px;border-top:2px solid #f3f4f6;text-align:center;background:#f9fafb">' +
        '<div style="font-size:11px;font-weight:700;color:var(--brand)">' + (count ? count + ' cita' + (count!==1?'s':'') : 'Sin citas') + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}
`;

c = c.replace('function showToast', adminCalJS + '\nfunction showToast');

// Update renderAll to also render admin calendar
c = c.replace(
  "  if (SOSATI.auth.isSecretary()) {\n    renderCalendar();\n  } else {\n    renderList();\n    if (SOSATI.auth.isAdmin()) updateStats();\n  }",
  "  if (SOSATI.auth.isSecretary()) {\n    renderCalendar();\n  } else {\n    renderList();\n    renderAdminCalendar();\n    if (SOSATI.auth.isAdmin()) updateStats();\n  }"
);

// Init admin calendar on load
c = c.replace(
  "  if (SOSATI.auth.isAdmin()) renderDashboard();",
  "  if (SOSATI.auth.isAdmin()) { renderDashboard(); renderAdminCalendar(); }"
);

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('OK - admin calendar JS added:', c.includes('renderAdminCalendar') ? 'YES' : 'NO');
