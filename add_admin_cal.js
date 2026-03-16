const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

// 1. Add CSS for sub-tabs
const css = `
    .citas-subtabs{background:#fff;padding:0 16px;display:flex;align-items:center;gap:4px;border-bottom:2px solid #f3f4f6;}
    .citas-subtab{padding:12px 16px;font-family:var(--font-body);font-size:13px;font-weight:600;color:#9ca3af;background:none;border:none;border-bottom:2.5px solid transparent;margin-bottom:-2px;cursor:pointer;transition:all 0.2s;}
    .citas-subtab.active{color:var(--brand);border-bottom-color:var(--brand);}
    .stats-inline-bar{margin-left:auto;display:flex;gap:12px;font-size:12px;font-weight:600;}
    .sib-item{color:#6b7280;}
    .sib-item.p{color:#f59e0b;}
    .sib-item.c{color:#10b981;}
    .sib-item.t{color:#6366f1;}
`;
c = c.replace('  </style>\n</head>', css + '  </style>\n</head>');

// 2. Replace stats-bar + filters + appts-list with sub-tabs layout
const oldHtml = `  <!-- TAB: CITAS -->
  <div id="tab-content-citas" style="display:none">
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

const newHtml = `  <!-- TAB: CITAS -->
  <div id="tab-content-citas" style="display:none">

    <!-- ADMIN VIEW -->
    <div id="admin-citas-view">
      <div class="citas-subtabs">
        <button class="citas-subtab active" id="subtab-cal" onclick="switchCitasView('cal')">Semana</button>
        <button class="citas-subtab" id="subtab-list" onclick="switchCitasView('list')">Lista</button>
        <div class="stats-inline-bar">
          <span class="sib-item"><span id="stat-total">0</span> total</span>
          <span class="sib-item p"><span id="stat-pending">0</span> pend.</span>
          <span class="sib-item c"><span id="stat-confirmed">0</span> conf.</span>
          <span class="sib-item t"><span id="stat-today">0</span> hoy</span>
        </div>
      </div>
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
    </div>

    <!-- SECRETARY VIEW -->
    <div id="secretary-citas-view" style="display:none">
      <div class="cal-toolbar">
        <button class="cal-nav-btn" onclick="calPrevWeek()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="cal-week-label" id="cal-week-label"></div>
        <button class="cal-nav-btn" onclick="calNextWeek()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <button class="cal-today-btn" onclick="calGoToday()">Hoy</button>
      </div>
      <div class="cal-grid" id="cal-grid"></div>
    </div>

  </div>`;

if (c.includes(oldHtml)) {
    c = c.replace(oldHtml, newHtml);
    console.log('HTML replaced OK');
} else {
    console.log('OLD HTML NOT FOUND - check file');
    process.exit(1);
}

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('Saved OK');
