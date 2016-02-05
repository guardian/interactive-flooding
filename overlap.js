import PNG from 'png-js'
import path from 'path'

// first file is mask, give histogram of subsequent files

function load(file) {
    return new Promise((resolve, _) => {
        PNG.decode(file, pixels => resolve({'name': path.basename(file, '.png'), pixels}));
    });
}

Promise.all(process.argv.slice(2).map(load)).then(files => {
    var [mask, ...layers] = files;

    var area = 0;
    var histograms = {};
    layers.forEach(layer => histograms[layer.name] = {});

    // only using R component (greyscale)
    for (var pixelI = 0; pixelI < mask.pixels.length; pixelI += 4) {
        if (!mask.pixels[pixelI]) continue;

        layers
            .map(layer => { return {'name': layer.name, 'pixel': layer.pixels[pixelI]}; })
            .filter(layer => layer.pixel > 0)
            .forEach(layer => {
                if (!histograms[layer.name][layer.pixel]) histograms[layer.name][layer.pixel] = 0;
                histograms[layer.name][layer.pixel]++;
            });

        area++;
    }

    console.log(JSON.stringify({area, histograms}));
}).catch(err => console.error(err));
