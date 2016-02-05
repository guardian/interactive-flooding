import fs from 'fs'
import path from 'path'

var histograms = {};
process.argv.slice(2).forEach(fn => {
    var id = path.basename(fn, '.json');
    var histogram = JSON.parse(fs.readFileSync(fn).toString());
    histograms[id] = histogram;
});

console.log(JSON.stringify(histograms));
