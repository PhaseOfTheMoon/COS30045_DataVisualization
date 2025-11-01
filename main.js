// ===================================
// MAIN JAVASCRIPT - Drug Testing Dashboard
// ===================================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');

    // Initialize all components
    initNavigation();
    initControls();
    initScrollEffects();

    // Load data and initialize charts (placeholder for now)
    // loadData();
});

// ===================================
// NAVIGATION
// ===================================

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-menu a');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

// ===================================
// FILTER CONTROLS
// ===================================

function initControls() {
    // Jurisdiction Filter
    const jurisdictionFilter = document.getElementById('jurisdiction-filter');
    if (jurisdictionFilter) {
        jurisdictionFilter.addEventListener('change', function() {
            const selectedJurisdiction = this.value;
            console.log('Jurisdiction filter changed to:', selectedJurisdiction);

            // TODO: Update all charts based on selected jurisdiction
            updateCharts({ jurisdiction: selectedJurisdiction });
        });
    }

    // Year Range Slider
    const yearRange = document.getElementById('year-range');
    const yearDisplay = document.getElementById('year-display');

    if (yearRange && yearDisplay) {
        yearRange.addEventListener('input', function() {
            yearDisplay.textContent = this.value;
        });

        yearRange.addEventListener('change', function() {
            const selectedYear = this.value;
            console.log('Year filter changed to:', selectedYear);

            // TODO: Update all charts based on selected year
            updateCharts({ year: selectedYear });
        });
    }

    // Reset Filters Button
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            console.log('Resetting filters');

            // Reset jurisdiction filter
            if (jurisdictionFilter) {
                jurisdictionFilter.value = 'all';
            }

            // Reset year range
            if (yearRange) {
                yearRange.value = 2024;
                yearDisplay.textContent = 2024;
            }

            // Reset all charts
            updateCharts({ jurisdiction: 'all', year: 2024 });
        });
    }
}

// ===================================
// SCROLL EFFECTS
// ===================================

function initScrollEffects() {
    // Add scroll listener for navbar shadow
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        }

        lastScroll = currentScroll;
    });

    // Intersection Observer for section animations (optional - for later)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const sectionObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all sections (disabled by default - enable when you add animations)
    // document.querySelectorAll('.section').forEach(section => {
    //     section.style.opacity = '0';
    //     section.style.transform = 'translateY(20px)';
    //     section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    //     sectionObserver.observe(section);
    // });
}

// ===================================
// DATA LOADING (Placeholder)
// ===================================

async function loadData() {
    try {
        // TODO: Load your CSV data here
        // const data = await d3.csv('data/police_enforcement_2024_positive_drug_tests.csv');
        // console.log('Data loaded:', data);

        // Initialize all charts with data
        // initChart1(data);
        // initChart2(data);
        // initChart3(data);
        // initChart4(data);
        // initChart5(data);

        console.log('Data loading placeholder - add your CSV file path');
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// ===================================
// CHART UPDATE FUNCTION (Placeholder)
// ===================================

function updateCharts(filters) {
    console.log('Updating charts with filters:', filters);

    // TODO: Update each chart based on filters
    // This function will be called when filters change

    const { jurisdiction, year } = filters;

    // Example of how you might update charts:
    // if (chart1) updateChart1(jurisdiction, year);
    // if (chart2) updateChart2(jurisdiction, year);
    // etc...
}

// ===================================
// INDIVIDUAL CHART INITIALIZATION (Placeholders)
// ===================================

function initChart1(data) {
    console.log('Initializing Chart 1: Testing Intensity Evolution');
    const container = d3.select('#chart-landscape');

    // Remove placeholder
    container.select('.chart-placeholder').remove();

    // TODO: Add your D3.js chart code here
    // Example:
    // const svg = container.append('svg')
    //     .attr('width', width)
    //     .attr('height', height);
}

function initChart2(data) {
    console.log('Initializing Chart 2: Detection Methods');
    const container = d3.select('#chart-methods');
    container.select('.chart-placeholder').remove();

    // TODO: Add your D3.js chart code here
}

function initChart3(data) {
    console.log('Initializing Chart 3: Demographics');
    const container = d3.select('#chart-demographics');
    container.select('.chart-placeholder').remove();

    // TODO: Add your D3.js chart code here
}

function initChart4(data) {
    console.log('Initializing Chart 4: COVID Impact');
    const container = d3.select('#chart-covid');
    container.select('.chart-placeholder').remove();

    // TODO: Add your D3.js chart code here
}

function initChart5(data) {
    console.log('Initializing Chart 5: Actionable Insights');
    const container = d3.select('#chart-insights');
    container.select('.chart-placeholder').remove();

    // TODO: Add your D3.js chart code here
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Format large numbers (e.g., 1000 -> 1K)
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Format percentage
function formatPercent(value) {
    return (value * 100).toFixed(1) + '%';
}

// Parse year from date string
function parseYear(dateString) {
    return new Date(dateString).getFullYear();
}

// Color scale for jurisdictions (consistent across charts)
function getJurisdictionColor(jurisdiction) {
    const colorMap = {
        'NSW': '#2563eb',
        'VIC': '#0891b2',
        'QLD': '#f59e0b',
        'SA': '#ef4444',
        'WA': '#8b5cf6',
        'TAS': '#10b981',
        'NT': '#f97316',
        'ACT': '#6366f1'
    };
    return colorMap[jurisdiction] || '#6b7280';
}

// ===================================
// EXPORT FUNCTIONS (for use in separate chart files)
// ===================================

window.dashboardUtils = {
    formatNumber,
    formatPercent,
    parseYear,
    getJurisdictionColor,
    updateCharts
};
