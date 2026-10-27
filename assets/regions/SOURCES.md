# Regional map sources

The website bundles local map geometry and a small mountain-point extract in `../../regions.js`. No external map service is called at runtime.

## Outlines

- Natural Earth administrative boundaries, distributed by geoBoundaries.
- Dataset: `KOR-ADM1-68945753`, 17 first-level regions, represented year 2021.
- Source: https://www.geoboundaries.org/api/current/gbOpen/KOR/ADM1/
- Pinned GeoJSON: https://github.com/wmgeolab/geoBoundaries/blob/9469f09/releaseData/gbOpen/KOR/ADM1/geoBoundaries-KOR-ADM1.geojson
- Natural Earth terms: https://www.naturalearthdata.com/about/terms-of-use/ (public domain).
- WGS84 coordinates were projected to a local 1000 × 800 SVG viewBox for each region. The outlines are illustrative, not survey or navigation boundaries. Current Korean display names are assigned separately.

## Mountain locations

- © GeoNames contributors, https://www.geonames.org/
- South Korea extract: https://download.geonames.org/export/dump/KR.zip
- Format: https://download.geonames.org/export/dump/readme.txt
- License: Creative Commons Attribution 4.0, https://creativecommons.org/licenses/by/4.0/
- Retrieved 2026-10-26. The local extract retains each point's GeoNames ID, name, latitude and longitude. Coordinates are filtered against region polygons, with up to 30 spatially distributed mountain/hill/summit/volcano locations per region. The interface randomly selects from these real locations for the additional dots; the first three correspond to the displayed names.
- Elevation and opening-hour fields show “정보 준비 중” until reviewed information is supplied. Any source elevation is retained only in the extract, not presented as a verified summit height. The cards reuse the original design's example photographs and do not represent live trail access information.

Visible attribution links appear in the site footer; no source caption is rendered below the regional maps. No OpenStreetMap data is included.
