// ===================================
// CENTRAL DATA LOADING MODULE
// ===================================

const dataLoader = {
    /**
     * Load drug testing enforcement data
     * @returns {Promise} Promise resolving to array of drug test records
     */
    loadDrugTests: function() {
        return d3.csv("./data/police_enforcement_2024_positive_drug_tests.csv", d3.autoType)
            .then(data => {
                console.log('Drug test data loaded:', data.length, 'records');
                console.log('Sample record:', data[0]);
                return data;
            })
            .catch(error => {
                console.error('Error loading drug test data:', error);
                throw error;
            });
    },

    /**
     * Load and filter data by year range
     * @param {number} startYear - Starting year (inclusive)
     * @param {number} endYear - Ending year (inclusive)
     * @returns {Promise} Promise resolving to filtered data
     */
    loadDrugTestsByYear: function(startYear, endYear) {
        return this.loadDrugTests().then(data => {
            return data.filter(d => d.YEAR >= startYear && d.YEAR <= endYear);
        });
    },

    /**
     * Load and filter data by jurisdiction
     * @param {string} jurisdiction - Jurisdiction code (NSW, VIC, QLD, SA, WA, TAS, NT, ACT)
     * @returns {Promise} Promise resolving to filtered data
     */
    loadDrugTestsByJurisdiction: function(jurisdiction) {
        return this.loadDrugTests().then(data => {
            return data.filter(d => d.JURISDICTION === jurisdiction);
        });
    },

    /**
     * Load and filter data by both year and jurisdiction
     * @param {string} jurisdiction - Jurisdiction code
     * @param {number} startYear - Starting year
     * @param {number} endYear - Ending year
     * @returns {Promise} Promise resolving to filtered data
     */
    loadFilteredData: function(jurisdiction, startYear, endYear) {
        return this.loadDrugTests().then(data => {
            return data.filter(d => {
                const yearMatch = d.YEAR >= startYear && d.YEAR <= endYear;
                const jurisdictionMatch = jurisdiction === 'all' || d.JURISDICTION === jurisdiction;
                return yearMatch && jurisdictionMatch;
            });
        });
    }
};

// Log when data loader is ready
console.log('Data loader initialized');
