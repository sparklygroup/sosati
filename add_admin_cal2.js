const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

// Add CSS
const css = `
    .citas-subtabs{background:#fff;padding:0 16px;display:flex;align-items:center;gap:4px;border-bottom:2px solid #f3f4f6;}
    .citas-subtab{padding:12px 16px;font-family:var(--font-body);font-size:13px;font-weight:600;color:#9ca3af;background:none;border:none;border-bottom:2.5px solid transparent;margin-bottom:-2px;cursor:pointer;transition:all 0.2s;}
    .citas-subtab.active{color:var(--brand);border-bottom-color:var(--brand);}
    .stats-inline-bar{margin-left:auto;display:flex;gap:12px;font-size:12px;font-weight:600;}
`;
c = c.replace('  </style>\n</head>', css + '  </style>\n</head>');

// Replace admin-citas-view content
const oldAdmin = `    <div id="admin-citas-view">
      <div class="stats-bar">
        <div class="stat-item"><div class="stat-num" id="stat-total">0</div><div class="stat-label">Total</div></div>
        <div class="stat-item"><div class="stat-num" id="stat-pending" style="color:var(--warning)">0</div><div class="stat-label">Pendientes</div></div>
        <div class="stat-item"><div class="stat-num" id="stat-confirmed" style="color:var(--success)">0</div><div class="stat-label">Confirmadas</div></div>
        <div class="stat-item"><div class="stat-num" id="stat-today" style="color:var(--info)">0</div><div class="stat-label">Hoy</div></div>
      </div>
      <div class="filters-bar">
        <input type="date" class="date-filter" id="filter-date" onchange="renderList()" />
        <select class="filter-select" id="filter-status" onchange="renderList()">
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <select class="filter-select" id="filter-location" onchange="renderList()">
          <option value="">Todas las oficinas</option>
        </select>
      </div>
      <div class="appts-container" id="appts-list"></div>
    </div>`;

const newAdmin = `    <div id="admin-citas-view">
      <!-- Sub-tabs -->
      <div class="citas-subtabs">
        <button class="citas-subtab active" id="subtab-cal" onclick="switchCitasView('cal')">Semana</button>
        <button class="citas-subtab" id="subtab-list" onclick="switchCitasView('list')">Lista</button>
        <div class="stats-inline-bar">
          <span style="color:#6b7280"><span id="stat-total">0</span> total</span>
          <span style="color:#f59e0b"><span id="stat-pending">0</span> pend.</span>
          <span style="color:#10b981"><span id="stat-confirmed">0</span> conf.</span>
          <span style="color:#6366f1"><span id="stat-today">0</span> hoy</span>
        </div>
      </div>
      <!-- Calendar -->
      <div id="admin-cal-view">
        <div class="cal-toolbar">
          <button class="cal-nav-btn" onclick="calPrevWeek()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <div class="cal-week-label" id="cal-week-label-admin"></div>
          <button class="cal-nav-btn" onclick="calNextWeek()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="cal-today-btn" onclick="calGoToday()">Hoy</button>
          <select class="filter-select" id="cal-loc" onchange="renderAdminCalendar()" style="max-width:140px;margin-left:8px">
            <option value="">Todas</option>
            <option value="belmont">Belmont</option>
            <option value="ventura">Ventura</option>
            <option value="kings">Kings</option>
          </select>
        </div>
        <div class="cal-grid" id="cal-grid-admin"></div>
      </div>
      <!-- List -->
      <div id="admin-list-view" style="display:none">
        <div class="filters-bar">
          <input type="date" class="date-filter" id="filter-date" onchange="renderList()" />
          <select class="filter-select" id="filter-status" onchange="renderList()">
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
          <select class="filter-select" id="filter-location" onchange="renderList()">
            <option value="">Todas las oficinas</option>
          </select>
        </div>
        <div class="appts-container" id="appts-list"></div>
      </div>
    </div>`;

if (c.includes(oldAdmin)) {
    c = c.replace(oldAdmin, newAdmin);
    console.log('HTML replaced OK');
} else {
    console.log('NOT FOUND');
    process.exit(1);
}

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('Saved');
