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
    }
  };

  console.log('Data loader initialized');
})();
