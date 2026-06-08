const https = require('https');
const fs = require('fs');

https.get('https://ibnux.github.io/data-indonesia/kecamatan/3273.json', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const districts = JSON.parse(data);
    let allVillages = [];
    let completed = 0;
    
    districts.forEach(d => {
      https.get(`https://ibnux.github.io/data-indonesia/kelurahan/${d.id}.json`, (res2) => {
        let vData = '';
        res2.on('data', chunk => vData += chunk);
        res2.on('end', () => {
          try {
            const villages = JSON.parse(vData);
            allVillages = allVillages.concat(villages.map(v => ({ id: v.id, nama: v.nama, kecamatan: d.nama })));
          } catch (e) {
            console.error(e);
          }
          completed++;
          
          if (completed === districts.length) {
            // Sort by nama
            allVillages.sort((a, b) => a.nama.localeCompare(b.nama));
            fs.writeFileSync('client/src/data/villages.json', JSON.stringify(allVillages, null, 2));
            console.log('Done!');
          }
        });
      });
    });
  });
});
