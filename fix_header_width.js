const fs = require('fs');

// Add max-width wrapper to body in CSS
let css = fs.readFileSync('/Users/davincimedia/Desktop/sosati/sosati-style.css', 'utf8');

css = css.replace(
  'body {\n  font-family: var(--font-body);\n  background: linear-gradient(180deg, #f4f3fa 0%, #eeedf7 100%);\n  min-height: 100vh;\n  color: var(--gray-800);\n  line-height: 1.6;\n  -webkit-font-smoothing: antialiased;\n}',
  'body {\n  font-family: var(--font-body);\n  background: linear-gradient(180deg, #f4f3fa 0%, #eeedf7 100%);\n  min-height: 100vh;\n  color: var(--gray-800);\n  line-height: 1.6;\n  -webkit-font-smoothing: antialiased;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n}\n\nbody > * {\n  width: 100%;\n  max-width: 480px;\n}'
);

fs.writeFileSync('/Users/davincimedia/Desktop/sosati/sosati-style.css', css);
console.log('CSS OK');
