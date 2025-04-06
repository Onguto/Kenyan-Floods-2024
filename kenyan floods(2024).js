// Define Kenya region
var kenya = ee.FeatureCollection("FAO/GAUL/2015/level0")
  .filter(ee.Filter.eq('ADM0_NAME', 'Kenya'));

// Load CHIRPS Daily Precipitation Data (2024)
var chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
  .filterBounds(kenya)
  .filterDate('2024-01-01', '2024-12-31')
  .map(function(image) {
    return image.clip(kenya); // Clip to Kenya boundary
  });

// Compute Descriptive Statistics
var meanPrecip = chirps.mean().clip(kenya);  // Mean precipitation
var minPrecip = chirps.min().clip(kenya);    // Minimum precipitation
var maxPrecip = chirps.max().clip(kenya);    // Maximum precipitation
var stdDevPrecip = chirps.reduce(ee.Reducer.stdDev()).clip(kenya);  // Standard deviation

// Visualization parameters
var visParams = {min: 0, max: 10, palette: ['white', 'blue', 'darkblue']};

// Add layers to the map
Map.centerObject(kenya, 5);
Map.addLayer(meanPrecip, visParams, 'Mean Precipitation (2024)');

// --- Generate a Time Series Chart for Monthly Precipitation ---
var months = ee.List.sequence(1, 12);

// Function to compute monthly precipitation over Kenya
var monthlyPrecip = ee.FeatureCollection(months.map(function(m) {
  var monthlyData = chirps.filter(ee.Filter.calendarRange(m, m, 'month')).mean();
  var meanVal = monthlyData.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: kenya,
    scale: 5000,
    bestEffort: true
  }).get('precipitation');

  return ee.Feature(null, {'month': m, 'precipitation': meanVal});
}));

// Convert to Chart
var precipChart = ui.Chart.feature.byFeature(monthlyPrecip, 'month', 'precipitation')
  .setOptions({
    title: 'Monthly Precipitation in Kenya (2024)',
    hAxis: {title: 'Month'},
    vAxis: {title: 'Precipitation (mm)'},
    lineWidth: 2,
    pointSize: 4
  });

// Print Chart
print(precipChart);