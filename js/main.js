// ===================================
// MAIN JAVASCRIPT - Drug Testing Dashboard
// ===================================

// Global chart handles
let landscapeChart = null;       // Chart 1 - multi series line
let methodsChart = null;         // Chart 2 - stacked area
let demographicsChart = null;    // Chart 3 - age group bar
let covidChart = null;           // Chart 4 - before/during/after COVID

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Dashboard initialized');

    // Ensure page starts at top
    window.scrollTo(0, 0);

    // Lock scrolling on hero section initially
    document.body.classList.add('hero-active');

    // Initialize all components
    initNavigation();
    initControls();
    initScrollEffects();
    initHeroAnimations();
    initExploreButton();
    initScrollAnimations();

    // Load data and initialize charts
    loadData();
});

// ===================================
// NAVIGATION
// ===================================

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-menu a');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            // Only handle hash links (internal page navigation)
            // Let external links (like about.html) navigate normally
            if (targetId.startsWith('#')) {
                e.preventDefault();

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
            }
            // For non-hash links (about.html), let browser navigate normally
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
        jurisdictionFilter.addEventListener('change', function () {
            const selectedJurisdiction = this.value;
            console.log('Jurisdiction filter changed to:', selectedJurisdiction);
            updateCharts({ jurisdiction: selectedJurisdiction });
        });
    }

    // Year Range Slider
    const yearRange = document.getElementById('year-range');
    const yearDisplay = document.getElementById('year-display');

    if (yearRange && yearDisplay) {
        yearRange.addEventListener('input', function () {
            yearDisplay.textContent = this.value;
        });

        yearRange.addEventListener('change', function () {
            const selectedYear = this.value;
            console.log('Year filter changed to:', selectedYear);
            updateCharts({ year: selectedYear });
        });
    }

    // Reset Filters Button
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', function () {
            console.log('Resetting filters');

            // Reset jurisdiction filter
            if (jurisdictionFilter) {
                jurisdictionFilter.value = 'all';
            }

            // Reset year range
            if (yearRange) {
                yearRange.value = 2024;
                if (yearDisplay) {
                    yearDisplay.textContent = 2024;
                }
            }

            updateCharts({ jurisdiction: 'all', year: 2024 });
        });
    }
}

// ===================================
// SCROLL EFFECTS
// ===================================

function initScrollEffects() {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function () {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        }
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
}

// ===================================
// HERO ANIMATIONS
// ===================================

function initHeroAnimations() {
    // Animate counting numbers after stat cards appear
    setTimeout(() => {
        animateCounters();
    }, 1400); // Start after stat cards have animated in (0.8s + 0.6s)
}

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = 2000; // 2 seconds
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeOut * target);

            counter.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target + suffix;
            }
        }

        requestAnimationFrame(updateCounter);
    });
}

// ===================================
// DATA LOADING
// ===================================

async function loadData() {
    try {
        const data = await dataLoader.loadDrugTests();
        console.log('Data loaded:', data.length, 'records');

        // These are defined in external chart_x.js files
        if (typeof initChart1 === 'function') {
            initChart1(data);
        }
        if (typeof initChart2 === 'function') {
            initChart2(data);
        }
        if (typeof initChart3 === 'function') {
            initChart3();
        }
        if (typeof initChart4 === 'function') {
            initChart4();
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// ===================================
// GLOBAL CHART UPDATE DISPATCHER
// ===================================

function updateCharts(filters) {
    console.log('Updating charts with filters:', filters);

    const jurisdictionFilter = document.getElementById('jurisdiction-filter');
    const yearRange = document.getElementById('year-range');

    const jurisdiction = filters.jurisdiction != null
        ? filters.jurisdiction
        : (jurisdictionFilter ? jurisdictionFilter.value : 'all');

    const year = filters.year != null
        ? +filters.year
        : (yearRange ? +yearRange.value : 2024);

    if (landscapeChart && typeof landscapeChart.update === 'function') {
        landscapeChart.update({ jurisdiction, year });
    }

    if (methodsChart && typeof methodsChart.update === 'function') {
        methodsChart.update({ jurisdiction, year });
    }

    if (demographicsChart && typeof demographicsChart.update === 'function') {
        demographicsChart.update({ jurisdiction, year });
    }

    if (covidChart && typeof covidChart.update === 'function') {
        covidChart.update({ jurisdiction, year });
    }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatPercent(value) {
    return (value * 100).toFixed(1) + '%';
}

function parseYear(dateString) {
    return new Date(dateString).getFullYear();
}

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
// EXPLORE BUTTON (Hero Section)
// ===================================

function initExploreButton() {
    const exploreBtn = document.getElementById('explore-button');
    const overviewSection = document.querySelector('#overview');

    if (exploreBtn && overviewSection) {
        exploreBtn.addEventListener('click', function () {
            // Unlock scrolling
            document.body.classList.remove('hero-active');

            // Small delay to ensure body is unlocked before scrolling
            setTimeout(() => {
                // Scroll to overview section
                const navHeight = 70;
                const targetPosition = overviewSection.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update URL hash
                history.replaceState(null, '', '#overview');
            }, 50);
        });
    }
}

// ===================================
// SCROLL ANIMATIONS (Storytelling)
// ===================================

function initScrollAnimations() {
    const navbar = document.querySelector('.navbar');
    const hero = document.querySelector('.hero');
    const sections = document.querySelectorAll('.section');

    // Intersection Observer for navbar appearance and scroll locking
    const navbarObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    // Hero is out of view, show navbar
                    navbar.classList.add('visible');
                } else {
                    // Hero is in view, hide navbar and re-lock scrolling
                    navbar.classList.remove('visible');
                    document.body.classList.add('hero-active');

                    // Scroll back to top of hero
                    window.scrollTo(0, 0);
                }
            });
        },
        {
            threshold: 0.1
        }
    );

    if (hero) {
        navbarObserver.observe(hero);
    }

    // Intersection Observer for section animations
    const sectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: '0px 0px -100px 0px'
        }
    );

    sections.forEach(section => {
        sectionObserver.observe(section);
    });
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
