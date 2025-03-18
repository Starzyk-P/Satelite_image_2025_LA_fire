var sent2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED"),
    land8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA"),
    geometry = 
    /* color: #0b4a8b */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-118.2863589647799, 34.38289568495318],
          [-118.4676333788424, 34.087706217957155],
          [-118.1325503710299, 34.00122480488461]]]),
    land9 = ee.ImageCollection("LANDSAT/LC09/C02/T1_TOA");

var image = ee.Image(sent2
  .filterDate("2025-01-07","2025-01-09") // zmień date
  .filterBounds(geometry)
  .sort("CLOUD_COVERAGE-ASSESMENT")
  .first());
  
print(image)

var clipped = image.clip(geometry)

var trueColour = {bands: ["B4", "B3", "B2"], min: 0, max: 3000};

Map.addLayer(clipped, trueColour, "True-colour image");

var falseColour = {bands: ["B4", "B3", "B2"], min: 0, max: 3000};

Map.addLayer(image, falseColour, "False-colour composite");


// Najlepsze kanały dla ognia
var fireComposite = {bands: ["B12", "B8", "B4"], min: 0, max: 3000};
Map.addLayer(image, fireComposite, "Fire Composite");

// NBR calculation
//var nbr = image.normalizedDifference(["B8", "B12"]);
//Map.addLayer(nbr, {min: -1, max: 1, palette: ["white", "black", "red"]}, "NBR");

// Obrazy przed i po pożarze

var beforeFire = sent2.filterDate("2024-12-01", "2024-12-31")
                      .sort("CLOUD_COVERAGE_ASSESSMENT")
                      .first()
                      .clip(geometry);

var afterFire = sent2.filterDate("2025-01-20", "2025-01-22")
                     .sort("CLOUD_COVERAGE_ASSESSMENT")
                     .first()
                     .clip(geometry);

var nbrBefore = beforeFire.normalizedDifference(["B8", "B12"]);
var nbrAfter = afterFire.normalizedDifference(["B8", "B12"]);

// Różnica dNBR
var dNBR = nbrBefore.subtract(nbrAfter);

var urbanAreas = ee.FeatureCollection("FAO/GAUL/2015/level2")
    .filter(ee.Filter.eq("ADM2_NAME", "Los Angeles")); 

var urbanAreasWithNumeric = urbanAreas.map(function(feature) {
    return feature.set("urban_value", 1); 
});

var urbanMask = urbanAreasWithNumeric.reduceToImage({
    properties: ["urban_value"],
    reducer: ee.Reducer.first()
});

urbanMask = urbanMask.gt(0);
var dNBRUrban = dNBR.updateMask(urbanMask.not());
Map.centerObject(geometry, 10);
Map.addLayer(dNBR, {min: -1, max: 1, palette: ["white", "orange", "red"]}, "Burn Severity (dNBR)");
Map.addLayer(dNBRUrban, {min: -1, max: 1, palette: ["white", "orange", "red"]}, "Urban Burn Severity");

Export.image.toDrive({
    image: dNBRUrban,
    description: "UrbanBurnSeverity",
    scale: 30,
    region: geometry
});
