var geometry = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-118.69604465968901, 34.1750630980976],
          [-118.69604465968901, 33.96575130137141],
          [-118.37194798000151, 33.96575130137141],
          [-118.37194798000151, 34.1750630980976]]], null, false),
    landsat9 = ee.ImageCollection("LANDSAT/LC08/C02/T1_RT_TOA"),
    sent2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED");

var image = ee.Image(sent2
  .filterDate("2025-01-03","2025-01-15") // zmień date na interesującą ciebie
  .filterBounds(geometry)
  .sort("CLOUD_COVERAGE-ASSESMENT")
  .first());
  
print(image)

var clipped = image.clip(geometry)

var trueColour = {bands: ["B4", "B3", "B2"], min: 0, max: 3000};

Map.addLayer(clipped, trueColour, "True-colour image");

var fireComposite = {bands: ["B12", "B8", "B4"], min: 0, max: 3000};
Map.addLayer(image, fireComposite, "Fire Composite");
