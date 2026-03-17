const fs = require('fs');
let c = fs.readFileSync('/Users/davincimedia/Desktop/sosati/server.js', 'utf8');

const route = `
app.get('/test-payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-payment.html'));
});

`;

c = c.replace('// ── API: STRIPE PAYMENTS', route + '// ── API: STRIPE PAYMENTS');
fs.writeFileSync('/Users/davincimedia/Desktop/sosati/server.js', c);
console.log('Route added OK');
