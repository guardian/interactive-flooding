import reqwest from 'reqwest'
import doT from 'olado/doT'
import topojson from 'mbostock/topojson'
import geo2path from '../lib/geo2path'
import svgEl from '../lib/svgEl'

import chartHTML from '../text/chart.html!text'
import streams from '../data/streams.json!json'
import stats from '../data/histograms.json!json'

const UPSTREAM = 0;
const DOWNSTREAM = 1;

var chartTemplateFn = doT.template(chartHTML);

var $$ = (el, s) => [].slice.apply(el.querySelectorAll(s));

function mergeCheap(target, source) {
    Object.keys(source).forEach(key => {
        if (!target[key]) target[key] = 0;
        target[key] += source[key];
    });
}

function getStreams(wbId, dir) {
    if (!streams[wbId]) return [];
    return [].concat.apply([wbId], streams[wbId][dir].map(id => getStreams(id, dir)));
}

function hist2series(histogram) {
    return Object.keys(histogram).map(key => { return {'name': key, 'value': histogram[key]}; });
}

export default function map(el, config) {
    var features = {}, mapEl, chartsEl;


    function init(topo) {
        mapEl = svgEl(el, 'svg', 'flood-map');
        chartsEl = document.createElement('div');
        chartsEl.className = 'flood-stats';
        el.appendChild(chartsEl);

        // TODO: canals different class
        function topo2svg(obj) {
            var geo = topojson.feature(topo, topo.objects[obj]);
            geo2path(geo).forEach(wb => {
                features[wb.id] = wb.paths.map(path => {
                    return svgEl(mapEl, 'path', 'flood-map__wb', {'data-id': wb.id, 'd': path});
                });
            });
        }

        topo2svg('all');
        topo2svg('canals');

        mapEl.addEventListener('mouseover', evt => {
            if (evt.target !== mapEl) {
                highlight(evt.target.getAttribute('data-id'));
            }
        });
    }

    function highlight(wbId) {
        var upstream = getStreams(wbId, UPSTREAM);
        var downstream = getStreams(wbId, DOWNSTREAM);

        function highlightFeature(clazz, featureId) {
            if (!features[featureId]) return;
            features[featureId].forEach(path => path.setAttribute('class', 'flood-map__wb ' + clazz));
        }

        $$(mapEl, '.is-upstream, .is-downstream').forEach(el => el.setAttribute('class', 'flood-map__wb'));
        upstream.forEach(highlightFeature.bind(null, 'is-upstream'));
        downstream.forEach(highlightFeature.bind(null, 'is-downstream'));

        var overall = {'area': 0, 'histograms': {'ALC': {}, 'NFI': {}}};
        upstream.map(sId => stats[sId]).filter(s => s)
            .forEach(stat => {
                overall.area += stat.area;
                mergeCheap(overall.histograms.ALC, stat.histograms.ALC);
                mergeCheap(overall.histograms.NFI, stat.histograms.NFI);
            });

        chartsEl.innerHTML =
            chartTemplateFn({'total': overall.area, 'series': hist2series(overall.histograms.ALC)}) +
            chartTemplateFn({'total': overall.area, 'series': hist2series(overall.histograms.NFI)});
    }

    reqwest({
        'url': config.assetPath + '/assets/waterbodies.json',
        'type': 'json',
        'success': init
    });
}


