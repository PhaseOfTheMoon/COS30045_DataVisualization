// loaddata.js - Data loading and processing

/**
 * Get color scheme for detection methods
 */
function getDetectionMethodColors() {
  return {
    'Oral Fluid': '#3b82f6',
    'Blood Test': '#ef4444',
    'Urine Test': '#10b981'
  };
}

// Load the combined dataset
d3.csv("data/PTestByDrugTJurisdic.csv", d => ({
  drugType: d.ColumnNames,
  jurisdiction: d.JURISDICTION,
  detectionMethod: d.BEST_DETECTION_METHOD === 'Yes' ? 'Detected' : d.BEST_DETECTION_METHOD,
  count: +d['Sum(COUNT)']
}))
.then(data => {
  console.log('Combined data loaded:', data);
  
  // Call drawing function  
  drawSunburst(data);  // Sunburst diagram

  // Add any other initialization functions here
  // createTooltip();
})
.catch(error => {
  console.error("Error loading CSV file:", error);
});