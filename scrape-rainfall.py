#!/usr/bin/python
import requests, time, shutil

base_url = 'http://datapoint.metoffice.gov.uk/public/data/layer/wxobs/all/json/capabilities?key=8b4719ce-173e-488e-9f4b-b00e59eb0c14'
img_url = 'http://datapoint.metoffice.gov.uk/public/data/layer/wxobs/RADAR_UK_Composite_Highres/png?TIME=%sZ&key=8b4719ce-173e-488e-9f4b-b00e59eb0c14'

r = requests.get(base_url)

data = r.json()

rainfall = filter(lambda x: x['@displayName'] == 'Rainfall', data['Layers']['Layer'])[0]

for t in rainfall['Service']['Times']['Time']:
    print t
    r = requests.get(img_url % t)
    with open('data/%s.png' % t, 'wb') as f:
        for chunk in r:
            f.write(chunk)

    time.sleep(1)
