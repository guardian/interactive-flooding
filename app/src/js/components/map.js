import reqwest from 'reqwest'
import topojson from 'mbostock/topojson'
import geo2path from '../lib/geo2path'
import svgEl from '../lib/svgEl'

import streams from '../data/streams.json!json'

var $$ = (el, s) => [].slice.apply(el.querySelectorAll(s));

export default function map(el, config) {
    var features = {}, mapEl;

    function topo2svg(topo, obj) {
        var geo = topojson.feature(topo, topo.objects[obj]);
        geo2path(geo).forEach(wb => {
            features[wb.id] = wb.paths.map(path => {
                return svgEl(mapEl, 'path', 'flood-map__wb', {'data-id': wb.id, 'd': path});
            });
        });
    }

    function unhighlight() {
        $$(mapEl, '.is-upstream, .is-downstream').forEach(el => el.setAttribute('class', 'flood-map__wb'));
    }

    function highlight(wbId, clazz) {
        if (!features[wbId]) {
            console.error(wbId);
            return;
        }
        features[wbId].forEach(path => path.setAttribute('class', 'flood-map__wb ' + clazz));
    }

    function highlightUpstream(wbId) {
        highlight(wbId, 'is-upstream');
        if (streams[wbId]) {
            streams[wbId][0].forEach(highlightUpstream);
        }
    }

    function highlightDownstream(wbId) {
        highlight(wbId, 'is-downstream');
        if (streams[wbId]) {
            streams[wbId][1].forEach(highlightDownstream);
        }
    }

    function init(topo) {
        mapEl = svgEl(el, 'svg', 'flood-map');

        topo2svg(topo, 'all');
        topo2svg(topo, 'canals');

        mapEl.addEventListener('mouseover', evt => {
            if (evt.target === mapEl) return;

            var wbId = evt.target.getAttribute('data-id');
            unhighlight();
            highlightUpstream(wbId);
            highlightDownstream(wbId);
        });
    }

    reqwest({
        'url': config.assetPath + '/assets/waterbodies.json',
        'type': 'json',
        'success': init
    });
}


