import sys, bs4, json

for fn in sys.argv[1:]:
    print fn
    soup = bs4.BeautifulSoup(open(fn))

    try:
        meta = json.loads(soup.find('div', class_='json').text)
        classification = json.loads(soup.find('div', class_='json_classification').text)

        with open('data/meta/%s.json' % meta['id'], 'w') as f:
            json.dump(meta, f)

        with open('data/classifications/%s.json' % meta['id'], 'w') as f:
            json.dump(classification, f)
    except AttributeError:
        print >> sys.stderr, fn
