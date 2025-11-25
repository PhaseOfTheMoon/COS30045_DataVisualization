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

// Load all datasets
Promise.all([
  // Dataset 1: Sunburst chart data (existing)
  d3.csv("data/PTestByDrugTJurisdic.csv", d => ({
    drugType: d.ColumnNames,
    jurisdiction: d.JURISDICTION,
    detectionMethod: d.BEST_DETECTION_METHOD === 'Yes' ? 'Detected' : d.BEST_DETECTION_METHOD,
    count: +d['Sum(COUNT)']
  })),

  // Dataset 2: Chart 7 - Enforcement correlation data
  d3.csv("data/FinArrChrByPositiveTest.csv", d3.autoType),

  // Dataset 3: Chart 8 - Enforcement severity data
  d3.csv("data/FinArrChrByJurisdiction.csv", d3.autoType)
])
.then(([sunburstData, chart7Data, chart8Data]) => {
  console.log('Combined data loaded:', sunburstData);
  console.log('Chart 7 data loaded:', chart7Data.length, 'records');
  console.log('Chart 8 data loaded:', chart8Data.length, 'records');

  // Call drawing functions with their respective data
  drawSunburst(sunburstData);  // Sunburst diagram (existing teammate's chart)

  // Initialize Chart 7 and Chart 8 (if functions exist)
  if (typeof drawChart7Heatmap === 'function') {
    drawChart7Heatmap(chart7Data);
  }
  if (typeof drawChart8Severity === 'function') {
    drawChart8Severity(chart8Data);
  }

  // Add any other initialization functions here
  // createTooltip();
})
.catch(error => {
  console.error("Error loading CSV file:", error);
});