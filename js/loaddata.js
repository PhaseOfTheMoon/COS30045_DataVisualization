// js/loaddata.js
// ===================================
// CENTRAL DATA LOADING MODULE
// ===================================

(function () {
  console.log('Data loader script loaded');

  /**
   * Optional helper: color scheme for detection methods
   * (global so other scripts can use it)
   */
  window.getDetectionMethodColors = function () {
    return {
      'Oral Fluid': '#3b82f6',
      'Blood Test': '#ef4444',
      'Urine Test': '#10b981'
    };
  };

  /**
   * Attach a single shared loader object to window so
   * main.js can call: await dataLoader.loadDrugTests()
   */
  window.dataLoader = {
    /**
     * Load full drug-testing dataset
     * @returns {Promise<Array<Object>>}
     */
    async loadDrugTests() {
      try {
        const data = await d3.csv(
          './data/police_enforcement_2024_positive_drug_tests.csv',
          d3.autoType
        );

        console.log('Drug test data loaded:', data.length, 'records');
        if (data.length > 0) {
          console.log('Sample record:', data[0]);
        }

        return data;
      } catch (error) {
        console.error('Error loading drug test data:', error);
        throw error;
      }
    },

    /**
     * Filter by year range (inclusive)
     */
    async loadDrugTestsByYear(startYear, endYear) {
      const data = await this.loadDrugTests();
      return data.filter(d => d.YEAR >= startYear && d.YEAR <= endYear);
    },

    /**
     * Filter by jurisdiction
     */
    async loadDrugTestsByJurisdiction(jurisdiction) {
      const data = await this.loadDrugTests();
      return data.filter(d => d.JURISDICTION === jurisdiction);
    },

    /**
     * Filter by jurisdiction + year range
     */
    async loadFilteredData(jurisdiction, startYear, endYear) {
      const data = await this.loadDrugTests();
      return data.filter(d => {
        const yearMatch = d.YEAR >= startYear && d.YEAR <= endYear;
        const jurisdictionMatch =
          jurisdiction === 'all' || d.JURISDICTION === jurisdiction;
        return yearMatch && jurisdictionMatch;
      });
    },

    /**
     * Load sunburst chart data
     */
    async loadSunburstData() {
      try {
        const data = await d3.csv('data/PTestByDrugTJurisdic.csv', d => ({
          drugType: d.ColumnNames,
          jurisdiction: d.JURISDICTION,
          detectionMethod: d.BEST_DETECTION_METHOD === 'Yes' ? 'Detected' : d.BEST_DETECTION_METHOD,
          count: +d['Sum(COUNT)']
        }));
        console.log('Sunburst data loaded:', data.length, 'records');
        return data;
      } catch (error) {
        console.error('Error loading sunburst data:', error);
        throw error;
      }
    },

    /**
     * Load Chart 7 data (Enforcement Correlation)
     */
    async loadChart7Data() {
      try {
        const data = await d3.csv('data/FinArrChrByPositiveTest.csv', d3.autoType);
        console.log('Chart 7 data loaded:', data.length, 'records');
        return data;
      } catch (error) {
        console.error('Error loading Chart 7 data:', error);
        throw error;
      }
    },

    /**
     * Load Chart 8 data (Enforcement Severity)
     */
    async loadChart8Data() {
      try {
        const data = await d3.csv('data/FinArrChrByJurisdiction.csv', d3.autoType);
        console.log('Chart 8 data loaded:', data.length, 'records');
        return data;
      } catch (error) {
        console.error('Error loading Chart 8 data:', error);
        throw error;
      }
    },

    /**
     * Initialize all charts
     */
    async initializeAllCharts() {
      try {
        console.log('Starting to load all chart data...');

        // Load all datasets in parallel
        const [sunburstData, chart7Data, chart8Data] = await Promise.all([
          this.loadSunburstData(),
          this.loadChart7Data(),
          this.loadChart8Data()
        ]);

        console.log('All data loaded successfully!');

        // Initialize charts (check if functions exist first)
        if (typeof drawSunburst === 'function') {
          drawSunburst(sunburstData);
        }
        if (typeof drawChart7Heatmap === 'function') {
          drawChart7Heatmap(chart7Data);
        }
        if (typeof drawChart8Severity === 'function') {
          drawChart8Severity(chart8Data);
        }

        console.log('All charts initialized!');
      } catch (error) {
        console.error('Error initializing charts:', error);
      }
    }
  };

  console.log('Data loader initialized');

  // Auto-initialize all charts when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.dataLoader.initializeAllCharts();
    });
  } else {
    // DOM already loaded
    window.dataLoader.initializeAllCharts();
  }
})();
