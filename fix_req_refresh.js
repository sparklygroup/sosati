const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

// 1. Fix req toolbar - push button to far right
const oldToolbar = `    <div style="background:#fff;padding:14px 16px;display:flex;gap:10px;border-bottom:1px solid #eee">
      <select class="filter-select" id="req-filter-service" onchange="renderRequisitos()" style="max-width:200px">
        <option value="tax">Impuestos</option>
        <option value="accounting">Contabilidad</option>
        <option value="dmv">DMV</option>
        <option value="insurance">Aseguranza</option>
        <option value="notary">Notario</option>
        <option value="general">Asesoria</option>
      </select>
      <button class="crm-export-btn" onclick="openAddReq()">+ Agregar</button>
    </div>`;

const newToolbar = `    <div style="background:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #eee">
      <select class="filter-select" id="req-filter-service" onchange="renderRequisitos()" style="max-width:200px">
        <option value="tax">Impuestos</option>
        <option value="accounting">Contabilidad</option>
        <option value="dmv">DMV</option>
        <option value="insurance">Aseguranza</option>
        <option value="notary">Notario</option>
        <option value="general">Asesoria</option>
      </select>
      <div style="margin-left:auto">
        <button class="crm-export-btn" onclick="openAddReq()">+ Agregar documento</button>
      </div>
    </div>`;

if (c.includes(oldToolbar)) {
    c = c.replace(oldToolbar, newToolbar);
    console.log('Toolbar OK');
} else {
    console.log('Toolbar not found');
}

// 2. Fix auto-refresh - make it more robust
const oldInterval = `  // Auto-refresh every 30 seconds
  setInterval(async function() { 
    await renderAll(); 
  }, 30000);`;

const newInterval = `  // Auto-refresh every 30 seconds
  setInterval(function() {
    renderAll().catch(function(e){ console.warn('Auto-refresh error:', e); });
  }, 30000);`;

if (c.includes(oldInterval)) {
    c = c.replace(oldInterval, newInterval);
    console.log('Auto-refresh OK');
} else {
    console.log('Auto-refresh not found - trying alternative');
    // Try finding it another way
    const idx = c.indexOf('setInterval');
    if (idx >= 0) console.log('setInterval found at:', idx, c.substring(idx, idx+100));
}

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('Saved');
