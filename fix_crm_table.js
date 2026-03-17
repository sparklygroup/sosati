const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', 'utf8');

// Add CRM table styles in the <style> block
const crmCSS = `
    .crm-table-wrap { overflow-x: auto; }
    .crm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .crm-table th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--gray-500); background: var(--gray-50); border-bottom: 1.5px solid var(--gray-100); white-space: nowrap; }
    .crm-table td { padding: 14px 16px; border-bottom: 1px solid var(--gray-100); color: var(--gray-700); vertical-align: middle; }
    .crm-table tr:hover td { background: var(--brand-soft); }
    .crm-table td:nth-child(3) { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .crm-name { font-weight: 600; color: var(--gray-800); white-space: nowrap; }
    .crm-empty { text-align: center; padding: 32px; color: var(--gray-400); font-style: italic; }
`;

// Insert before </style>
c = c.replace('  </style>\n</head>', crmCSS + '  </style>\n</head>');

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-admin.html', c);
console.log('OK - CRM table styles added');
