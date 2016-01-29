import sys, json

waterbodies = {}

for fn in sys.argv[1:]:
    meta = json.load(open(fn))

    wb_id = meta['id']
    wb_upstream = [us['stream'].replace('WaterBody/', '') for us in meta['upstream'] if us['stream']]
    wb_downstream = [us['stream'].replace('WaterBody/', '') for us in meta['downstream'] if us['stream']]

    waterbodies[wb_id] = [wb_upstream, wb_downstream]

print json.dumps(waterbodies)
