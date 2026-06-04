const fs = require('fs');
const content = fs.readFileSync('client/src/pages/wisata/WisataMapPage.jsx', 'utf-8');
const marker1 = '                })}\n              </div>\n            </div>';
const parts = content.split(marker1);
if(parts.length !== 2) { console.log('Could not find marker'); process.exit(1); }
const good_start = parts[0] + marker1;
const rest_of_the_code = fs.readFileSync('rest.txt', 'utf-8');
fs.writeFileSync('client/src/pages/wisata/WisataMapPage.jsx', good_start + rest_of_the_code, 'utf-8');
console.log('Fixed');
