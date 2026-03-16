const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

// 1. Move stats from sub-tabs bar to bottom of calendar
// Replace stats in sub-tabs with just the two buttons
const oldSubtabs = `      <div class="citas-subtabs">
        <button class="citas-subtab active" id="subtab-cal" onclick="switchCitasView('cal')">Semana</button>
        <button class="citas-subtab" id="subtab-list" onclick="switchCitasView('list')">Lista</button>
        <div class="stats-inline-bar">
          <span style="color:#6b7280"><span id="stat-total">0</span> total</span>
          <span style="color:#f59e0b"><span id="stat-pending">0</span> pend.</span>
          <span style="color:#10b981"><span id="stat-confirmed">0</span> conf.</span>
          <span style="color:#6366f1"><span id="stat-today">0</span> hoy</span>
        </div>
      </div>`;

const newSubtabs = `      <div class="citas-subtabs">
        <button class="citas-subtab active" id="subtab-cal" onclick="switchCitasView('cal')">Semana</button>
        <button class="citas-subtab" id="subtab-list" onclick="switchCitasView('list')">Lista</button>
      </div>`;

if (c.includes(oldSubtabs)) {
    c = c.replace(oldSubtabs, newSubtabs);
    console.log('Subtabs updated OK');
} else {
    console.log('Subtabs not found');
}

// 2. Add stats bar below cal-grid-admin
const oldGrid = '        <div class="cal-grid" id="cal-grid-admin"></div>\n      </div>';
const newGrid = `        <div class="cal-grid" id="cal-grid-admin"></div>
        <div class="stats-bar" id="cal-stats-bar" style="border-top:2px solid #f3f4f6">
          <div class="stat-item"><div class="stat-num" id="stat-total">0</div><div class="stat-label">Total</div></div>
          <div class="stat-item"><div class="stat-num" id="stat-pending" style="color:var(--warning)">0</div><div class="stat-label">Pendientes</div></div>
          <div class="stat-item"><div class="stat-num" id="stat-confirmed" style="color:var(--success)">0</div><div class="stat-label">Confirmadas</div></div>
          <div class="stat-item"><div class="stat-num" id="stat-today" style="color:var(--info)">0</div><div class="stat-label">Hoy</div></div>
        </div>
      </div>`;

if (c.includes(oldGrid)) {
    c = c.replace(oldGrid, newGrid);
    console.log('Stats moved to bottom OK');
} else {
    console.log('Grid not found');
}

// 3. Add legend below toolbar showing office colors
const oldToolbarEnd = '        <div class="cal-grid" id="cal-grid-admin"></div>';
const newToolbarEnd = `        <div style="display:flex;gap:14px;padding:8px 16px;background:#f9fafb;border-bottom:1px solid #f3f4f6;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#6b7280"><div style="width:10px;height:10px;border-radius:50%;background:var(--brand)"></div>Belmont</div>
          <div style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#6b7280"><div style="width:10px;height:10px;border-radius:50%;background:#7c3aed"></div>Ventura</div>
          <div style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#6b7280"><div style="width:10px;height:10px;border-radius:50%;background:#06b6d4"></div>Kings Canyon</div>
        </div>
        <div class="cal-grid" id="cal-grid-admin"></div>`;

if (c.includes(oldToolbarEnd)) {
    c = c.replace(oldToolbarEnd, newToolbarEnd);
    console.log('Legend added OK');
} else {
    console.log('Toolbar end not found');
}

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('Saved');
