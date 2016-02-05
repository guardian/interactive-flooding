# Datasets

## Waterbodies

The Environment Agency has data about all the waterbodies in England and how they are connected.

e.g. http://environment.data.gov.uk/catchment-planning/WaterBody/GB104026066800

### Processing

1. Download the following shapefiles from http://www.geostore.com/environment-agency/
   ```
   WFD_River_Waterbody_Catchments_Cycle2_Draft.zip
   WFD_Coastal_Waterbodies_Cycle2_Draft.zip
   WFD_Transitional_Waterbodies_Cycle2_Draft.zip
   ```
   
2. Merge shapefiles, I used QGIS and http://michaelminn.com/linux/mmqgis/

3. Extract a list of EA waterbody IDs (`EA_WB_ID`) from the shapefile attribute table, then convert to URLs
   e.g. `http://environment.data.gov.uk/catchment-planning/WaterBody/GB104026066800`

4. Download the URLs
   ```bash
   mkdir -p data/waterbodies
   cd data/waterbodies
   wget -xi ../../wb-urls.txt -w 5
   ```

5. Scrape the files
   ```bash
   mkdir -p data/waterbodies/meta data/waterbodies/classifications
   python scrape-wb.py data/waterbodies/environment.data.gov.uk/catchment-planning/WaterBody/*
   ```

6. Combine all the upstream/downstream data into one file
   ```bash
   python combine-wb.py data/waterbodies/meta/* > data/waterbodies/streams.json
   ```

7. Check for missing waterbodies:
   ```bash
   cat data/waterbodies/streams.json | jq -r '[. | to_entries[] | .value[]] | add[]' |
       sort | uniq | while read id; do
           if [ ! -f data/waterbodies/meta/$id.json ]; then echo $id; fi
       done
   ```
   If some are missing, convert those to EA URLs and go back to `4.`

8. Canal shape files do not seem to be available on geostore, so need to be done manually
   1. Download the raw shapes
      
      ```
      cd data/waterbodies
      wget -xi ../../canal-urls.txt
      ```
   2. Convert to GeoJSON
      
      ```bash
      mkdir data/waterbodies/canals
      find data/waterbodies/environment.data.gov.uk/ -name '*.gml' |
          while read fn; do
              ogr2ogr -f GeoJSON data/waterbodies/canals/$(basename $fn .gml).json $fn
          done
      ```
   3. Combine into one GeoJSON file, I used https://github.com/mapbox/geojson-merge
      
      ```bash
      geojson-merge data/waterbodies/canals/*.json > data/waterbodies/canals.json
      ```

## National Forest Inventory

NFI available from http://www.forestry.gov.uk/datadownload

## Agricultural Land Classification

ALC available from http://www.gis.naturalengland.org.uk/pubs/gis/GIS_register.asp. It doesn't seem to come with any projection information associated with the shapefile, to fix:
```
ogr2ogr -t_srs EPSG:27700 -s_srs EPSG:27700 magalc_srs.shp maglac.shp
```

# Analysis

To find out what the break down of tree cover and agricultural classification is for each waterbody, we need a way of testing the overlap between the various shapefiles. Because they are so large, it seems easier to rasterize the files and we can use a large enough resolution that the error margin will be small.

## Rasterize

Rasterize everything using the same extents, dimensions and projection.

- Extents: `(134150, 11500) (655850, 657700)`
- Dimensions: `(5217, 6462)`
- Projection: `EPSG:27700`

This means each pixel represents a 100m<sup>2</sup> area. 

Options for all `gdal_rasterize` commands are thus:
```
-te 134150 11500 655850 657700 -ts 5217 6462 -a_nodata 0 -ot Byte
```

Rasterized TIFFs at this size are ~33Mb, so convert them to PNGs. Steps are:

1. ALC is easy to rasterize
   
   ```
   gdal_rasterize -a REF_CODE -l magalc_srs magalc_srs.shp ALC.tiff
   convert ALC.tiff ALC.png
   ```
2. NFI is hard. The shapefile has no numeric properties which represent the classification (`IFT_IOA`), and as far as I can tell `gdal_rasterize` isn't capable of mapping string properties to numbers, so you need to do it manually. I created a new field called `IFT_IOA_NO`, then populated it with a mapping defined in `NFI-map.csv`
   
   ```
   gdal_rasterize -a IFT_IOA_NO -l NATIONAL_FOREST_INVENTORY_GB NATIONAL_FOREST_INVENTORY_GB.shp NFI.tiff
   convert NFI.tiff
   ```
3. Create a mask for each waterbody.
   
   ```
   gdal_rasterize -burn 1 -where 'EA_WB_ID="id"' -l all all.shp out.tiff
   convert out.tiff data/waterbodies/raster/id.png
   ```

## Histograms

Get a histogram for each waterbody:
```
babel-node overlap.js data/waterbodies/raster/id.png ALC.png NFI.png
```
