#!/bin/bash
# raster options
extent_opts="-te 134150 11500 655850 657700 -ts 5217 6462"
opts="$extent_opts -a_nodata 0 -ot Byte"

# rasterize NFI
gdal_rasterize $opts -a IFT_IOA_NO -l NATIONAL_FOREST_INVENTORY_GB NATIONAL_FOREST_INVENTORY_GB.ship out.tiff

# rasterize ALC
gdal_rasterize $opts -a REF_CODE -l magalc_srs magalc_srs.shp out.tiff

# rasterize a waterbody
gdal_rasterize $opts -burn 1 -where "EA_WB_ID=\"$id\"" -l all all.shp out.tiff

# convert from TIFF to PNG (imagemagick)
convert out.tiff out.png 2> /dev/null
