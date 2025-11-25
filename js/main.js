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
        link.addEventListener('click', function(e) {
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

    // Enable when you add animations
    // document.querySelectorAll('.section').forEach(section => {
    //     section.style.opacity = '0';
    //     section.style.transform = 'translateY(20px)';
    //     section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    //     sectionObserver.observe(section);
    // });
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
// DATA LOADING (Placeholder)
// ===================================

async function loadData() {
    try {
        const data = await dataLoader.loadDrugTests();
        console.log('Data loaded:', data.length, 'records');

        initChart1(data);
        initChart2(data);
        initChart3();
        initChart4();   // uses YearByJurisdiction.csv
        // initChart5(data);
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
// CHART 1  multi series line chart
// interactive + tooltips + multi-select legend FILTER
// ===================================

function initChart1(rawData) {
    console.log('Initializing Chart 1: Testing Intensity Evolution');

    const container = d3.select('#chart-landscape');
    container.select('.chart-placeholder').remove();

    const parent = container.node().getBoundingClientRect();
    const margin = { top: 45, right: 140, bottom: 45, left: 60 };
    const width = parent.width - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Tooltip div (one per page)
    let tooltip = d3.select('body').select('.chart-tooltip-landscape');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'chart-tooltip-landscape')
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('background', 'rgba(15,23,42,0.95)')
            .style('color', '#fff')
            .style('padding', '6px 10px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('box-shadow', '0 4px 10px rgba(15,23,42,0.4)')
            .style('opacity', 0);
    }

    const data = rawData
        .filter(d =>
            d.YEAR != null &&
            d.JURISDICTION &&
            d.COUNT != null &&
            !isNaN(d.COUNT)
        )
        .map(d => ({
            YEAR: +d.YEAR,
            JURISDICTION: d.JURISDICTION.trim(),
            COUNT: +d.COUNT
        }));

    const minYear = d3.min(data, d => d.YEAR);
    const maxYear = d3.max(data, d => d.YEAR);

    function buildSeries(filtered) {
        const grouped = d3.group(filtered, d => d.JURISDICTION);
        return Array.from(grouped, ([jurisdiction, values]) => ({
            jurisdiction,
            values: values.slice().sort((a, b) => a.YEAR - b.YEAR)
        }));
    }

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const line = d3.line()
        .x(d => x(d.YEAR))
        .y(d => y(d.COUNT));

    const xAxisGroup = g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`);

    const yAxisGroup = g.append('g')
        .attr('class', 'y-axis');

    g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 38)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .text('YEAR');

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .text('Number of Positive Tests');

    const linesGroup = g.append('g').attr('class', 'lines');
    const pointsGroup = g.append('g').attr('class', 'points');
    const legendGroup = g.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 15}, 0)`);

    // Multi-select state for legend
    const selectedSet = new Set();  // empty = show all
    let currentFilters = { jurisdiction: 'all', year: maxYear };

    function highlightOnHover(jurisdiction) {
        linesGroup.selectAll('.line-series')
            .attr('stroke-opacity', d => d.jurisdiction === jurisdiction ? 1 : 0.15);

        pointsGroup.selectAll('.point')
            .attr('opacity', d => d.JURISDICTION === jurisdiction ? 1 : 0.1);
    }

    function clearHoverHighlight() {
        linesGroup.selectAll('.line-series').attr('stroke-opacity', 1);
        pointsGroup.selectAll('.point').attr('opacity', 1);
    }

    function update({ jurisdiction = 'all', year = maxYear } = {}) {
        currentFilters = { jurisdiction, year };
        const selectedYear = +year;

        // Apply top filters (jurisdiction dropdown + year slider)
        const filtered = data.filter(d =>
            d.YEAR >= minYear &&
            d.YEAR <= selectedYear &&
            (jurisdiction === 'all' || d.JURISDICTION === jurisdiction)
        );

        const seriesAll = buildSeries(filtered);

        // If there is a selection, only keep selected jurisdictions
        const hasSelection = selectedSet.size > 0;
        const visibleSeries = hasSelection
            ? seriesAll.filter(s => selectedSet.has(s.jurisdiction))
            : seriesAll;

        x.domain([minYear, selectedYear]);

        const maxCount =
            d3.max(visibleSeries, s => d3.max(s.values, d => d.COUNT)) || 0;

        y.domain([0, maxCount]).nice();

        const xAxis = d3.axisBottom(x)
            .ticks(10)
            .tickFormat(d3.format('d'));

        const yAxis = d3.axisLeft(y)
            .ticks(8)
            .tickFormat(d => formatNumber(d));

        xAxisGroup.transition().duration(600).call(xAxis);
        yAxisGroup.transition().duration(600).call(yAxis);

        // ----- LINES (only visibleSeries) -----
        const lines = linesGroup.selectAll('.line-series')
            .data(visibleSeries, d => d.jurisdiction);

        const linesEnter = lines.enter()
            .append('path')
            .attr('class', 'line-series')
            .attr('fill', 'none')
            .attr('stroke-width', 2)
            .attr('stroke', d => getJurisdictionColor(d.jurisdiction))
            .attr('stroke-opacity', 0);

        linesEnter.merge(lines)
            .transition()
            .duration(800)
            .attr('stroke', d => getJurisdictionColor(d.jurisdiction))
            .attr('stroke-opacity', 1)
            .attr('d', d => line(d.values));

        lines.exit()
            .transition()
            .duration(300)
            .attr('stroke-opacity', 0)
            .remove();

        // ----- POINT MARKERS (only visibleSeries) -----
        const flattenedPoints = visibleSeries.flatMap(s =>
            s.values.map(v => ({
                YEAR: v.YEAR,
                COUNT: v.COUNT,
                JURISDICTION: s.jurisdiction
            }))
        );

        const points = pointsGroup.selectAll('.point')
            .data(flattenedPoints, d => `${d.JURISDICTION}-${d.YEAR}`);

        const pointsEnter = points.enter()
            .append('circle')
            .attr('class', 'point')
            .attr('r', 3)
            .attr('cx', d => x(d.YEAR))
            .attr('cy', d => y(d.COUNT))
            .attr('fill', d => getJurisdictionColor(d.JURISDICTION))
            .attr('opacity', 0);

        pointsEnter.merge(points)
            .on('mouseover', function (event, d) {
                highlightOnHover(d.JURISDICTION);

                tooltip
                    .style('opacity', 1)
                    .html(
                        `<strong>${d.JURISDICTION}</strong><br/>` +
                        `Year: ${d.YEAR}<br/>` +
                        `Positive tests: ${formatNumber(d.COUNT)}`
                    );

                const [pageX, pageY] = [event.pageX, event.pageY];
                tooltip
                    .style('left', (pageX + 12) + 'px')
                    .style('top', (pageY - 28) + 'px');
            })
            .on('mousemove', function (event) {
                const [pageX, pageY] = [event.pageX, event.pageY];
                tooltip
                    .style('left', (pageX + 12) + 'px')
                    .style('top', (pageY - 28) + 'px');
            })
            .on('mouseout', function () {
                tooltip.style('opacity', 0);
                clearHoverHighlight();
            })
            .transition()
            .duration(800)
            .attr('cx', d => x(d.YEAR))
            .attr('cy', d => y(d.COUNT))
            .attr('fill', d => getJurisdictionColor(d.JURISDICTION))
            .attr('opacity', 1);

        points.exit()
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .remove();

        // ----- LEGEND (always show ALL jurisdictions that pass top filter) -----
        const legend = legendGroup.selectAll('.legend-item')
            .data(seriesAll, d => d.jurisdiction);

        const legendEnter = legend.enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`)
            .on('mouseover', (event, d) => {
                // only highlight if currently visible
                const isVisible = !hasSelection || selectedSet.has(d.jurisdiction);
                if (isVisible) {
                    highlightOnHover(d.jurisdiction);
                }
            })
            .on('mouseout', () => {
                clearHoverHighlight();
            })
            .on('click', (event, d) => {
                // toggle selection
                if (selectedSet.has(d.jurisdiction)) {
                    selectedSet.delete(d.jurisdiction);
                } else {
                    selectedSet.add(d.jurisdiction);
                }
                // re-render chart with same filters, but new selection
                update(currentFilters);
            });

        legendEnter.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('fill', d => getJurisdictionColor(d.jurisdiction));

        legendEnter.append('text')
            .attr('x', 18)
            .attr('y', 10)
            .attr('font-size', 11)
            .attr('fill', '#374151')
            .text(d => d.jurisdiction);

        legend.merge(legendEnter)
            .transition()
            .duration(400)
            .attr('transform', (d, i) => `translate(0, ${i * 20})`)
            .select('rect')
            .attr('fill', d => getJurisdictionColor(d.jurisdiction));

        legend.exit()
            .transition()
            .duration(200)
            .style('opacity', 0)
            .remove();

        // style legend text/swatches based on selection
        legendGroup.selectAll('.legend-item').each(function (d) {
            const isSelected = selectedSet.size === 0 || selectedSet.has(d.jurisdiction);
            d3.select(this).select('text')
                .attr('font-weight', selectedSet.has(d.jurisdiction) ? 'bold' : 'normal')
                .attr('fill', isSelected ? '#111827' : '#9ca3af');
            d3.select(this).select('rect')
                .attr('stroke', selectedSet.has(d.jurisdiction) ? '#111827' : 'none')
                .attr('stroke-width', selectedSet.has(d.jurisdiction) ? 1.5 : 0)
                .attr('opacity', isSelected ? 1 : 0.35);
        });

        clearHoverHighlight();
    }

    const jurisdictionFilter = document.getElementById('jurisdiction-filter');
    const yearRange = document.getElementById('year-range');

    const initialJurisdiction = jurisdictionFilter ? jurisdictionFilter.value : 'all';
    const initialYear = yearRange ? +yearRange.value : maxYear;

    update({ jurisdiction: initialJurisdiction, year: initialYear });

    landscapeChart = { update };
}


// ===================================
// CHART 2  stacked area chart by detection method
// with tooltips + legend filter for Stage 1 / Stage 3
// ===================================

function initChart2(rawData) {
    console.log('Initializing Chart 2: Detection Methods stacked area');

    const container = d3.select('#chart-methods');
    container.select('.chart-placeholder').remove();

    const parent = container.node().getBoundingClientRect();
    const margin = { top: 45, right: 40, bottom: 45, left: 60 };
    const width = parent.width - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Re-use the tooltip from Chart 1 if it exists, otherwise create it
    let tooltip = d3.select('body').select('.chart-tooltip-landscape');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'chart-tooltip-landscape')
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('background', 'rgba(15,23,42,0.95)')
            .style('color', '#fff')
            .style('padding', '6px 10px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('box-shadow', '0 4px 10px rgba(15,23,42,0.4)')
            .style('opacity', 0);
    }

    // Base filter: only the positive_drug_tests rows for the two methods
    const filteredBase = rawData.filter(d =>
        d.YEAR != null &&
        d.DETECTION_METHOD &&
        d.COUNT != null &&
        !isNaN(d.COUNT) &&
        d.METRIC === 'positive_drug_tests'
    );

    // Global year range from the whole dataset
    const allYears = rawData
        .map(d => +d.YEAR)
        .filter(y => !isNaN(y));
    const minYear = d3.min(allYears);
    const maxYear = d3.max(allYears);

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const stack = d3.stack();
    const area = d3.area()
        .x(d => x(d.data.YEAR))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

    const xAxisGroup = g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`);

    const yAxisGroup = g.append('g')
        .attr('class', 'y-axis');

    g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 38)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .text('YEAR');

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .text('Number of Positive Tests by Method');

    const areasGroup = g.append('g').attr('class', 'areas');
    const pointsGroup = g.append('g').attr('class', 'method-points');
    const legendGroup = g.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(0,0)');

    const colorMap = {
        stage1: '#2563eb',
        stage3: '#22c55e'
    };

    const stageMeta = {
        stage1: {
            label: 'Stage 1 Screening tests',
            matches: m => m === 'Indicator (Stage 1)'
        },
        stage3: {
            label: 'Stage 3 Laboratory confirmation',
            matches: m => m === 'Laboratory or Toxicology (Stage 3)'
        }
    };

    // Legend selection state (multi-select)
    const selectedStages = new Set();      // empty = both shown
    let currentFilters = { jurisdiction: 'all', year: maxYear };

    // Aggregate into one row per year, even when there are zero tests
    function aggregateData(jurisdiction, year) {
        const maxYearShown = Math.min(+year, maxYear);

        const rows = [];
        for (let yVal = minYear; yVal <= maxYearShown; yVal++) {
            const rowsForYear = filteredBase.filter(d =>
                +d.YEAR === yVal &&
                (jurisdiction === 'all' || d.JURISDICTION === jurisdiction)
            );

            let s1 = 0;
            let s3 = 0;
            rowsForYear.forEach(r => {
                const c = +r.COUNT || 0;
                if (stageMeta.stage1.matches(r.DETECTION_METHOD)) {
                    s1 += c;
                } else if (stageMeta.stage3.matches(r.DETECTION_METHOD)) {
                    s3 += c;
                }
            });

            rows.push({
                YEAR: yVal,
                stage1: s1,
                stage3: s3
            });
        }

        return rows;
    }

    function clearHighlight() {
        areasGroup.selectAll('.area-series')
            .attr('opacity', d => d.key === 'stage3' ? 0.85 : 0.9);
        pointsGroup.selectAll('.method-point')
            .attr('opacity', 1);
    }

    function highlightStage(key) {
        areasGroup.selectAll('.area-series')
            .attr('opacity', d => d.key === key ? 1 : 0.2);
        pointsGroup.selectAll('.method-point')
            .attr('opacity', d => d.key === key ? 1 : 0.2);
    }

    function update({ jurisdiction = 'all', year = maxYear } = {}) {
        currentFilters = { jurisdiction, year };

        const dataWide = aggregateData(jurisdiction, year);
        if (!dataWide.length) return;

        // Visible stages based on legend selection
        const allKeys = ['stage1', 'stage3'];
        const visibleKeys = selectedStages.size > 0
            ? allKeys.filter(k => selectedStages.has(k))
            : allKeys.slice();

        x.domain([minYear, +year]);

        // y-domain based on the visible stages only
        let maxTotal = 0;
        dataWide.forEach(row => {
            let rowTotal = 0;
            visibleKeys.forEach(k => { rowTotal += row[k] || 0; });
            if (rowTotal > maxTotal) maxTotal = rowTotal;
        });
        y.domain([0, maxTotal]).nice();

        const xAxis = d3.axisBottom(x)
            .ticks(10)
            .tickFormat(d3.format('d'));

        const yAxis = d3.axisLeft(y)
            .ticks(8)
            .tickFormat(d => formatNumber(d));

        xAxisGroup.transition().duration(600).call(xAxis);
        yAxisGroup.transition().duration(600).call(yAxis);

        // Stack only the visible keys
        stack.keys(visibleKeys);
        const stacked = stack(dataWide);

        // ----- AREAS -----
        const series = areasGroup.selectAll('.area-series')
            .data(stacked, d => d.key);

        const enter = series.enter()
            .append('path')
            .attr('class', 'area-series')
            .attr('fill', d => colorMap[d.key] || '#9ca3af')
            .attr('stroke', d => colorMap[d.key] || '#9ca3af')
            .attr('stroke-width', 1.5)
            .attr('opacity', d => d.key === 'stage3' ? 0.85 : 0.9)
            .attr('d', area);

        enter.merge(series)
            .transition()
            .duration(800)
            .attr('fill', d => colorMap[d.key] || '#9ca3af')
            .attr('stroke', d => colorMap[d.key] || '#9ca3af')
            .attr('d', area);

        series.exit()
            .transition()
            .duration(300)
            .style('opacity', 0)
            .remove();

        // ----- POINT MARKERS + TOOLTIP -----
        const flattenedPoints = [];
        visibleKeys.forEach(k => {
            dataWide.forEach(row => {
                const value = row[k];
                if (value > 0) {
                    flattenedPoints.push({
                        YEAR: row.YEAR,
                        value,
                        key: k
                    });
                }
            });
        });

        const points = pointsGroup.selectAll('.method-point')
            .data(flattenedPoints, d => `${d.key}-${d.YEAR}`);

        const pointsEnter = points.enter()
            .append('circle')
            .attr('class', 'method-point')
            .attr('r', 3)
            .attr('cx', d => x(d.YEAR))
            .attr('cy', d => y(d.value))
            .attr('fill', d => colorMap[d.key])
            .attr('opacity', 0);

        pointsEnter.merge(points)
            .on('mouseover', function (event, d) {
                highlightStage(d.key);

                tooltip
                    .style('opacity', 1)
                    .html(
                        `<strong>${stageMeta[d.key].label}</strong><br/>` +
                        `Year: ${d.YEAR}<br/>` +
                        `Positive tests: ${formatNumber(d.value)}`
                    );

                const [pageX, pageY] = [event.pageX, event.pageY];
                tooltip
                    .style('left', (pageX + 12) + 'px')
                    .style('top', (pageY - 28) + 'px');
            })
            .on('mousemove', function (event) {
                const [pageX, pageY] = [event.pageX, event.pageY];
                tooltip
                    .style('left', (pageX + 12) + 'px')
                    .style('top', (pageY - 28) + 'px');
            })
            .on('mouseout', function () {
                tooltip.style('opacity', 0);
                clearHighlight();
            })
            .transition()
            .duration(800)
            .attr('cx', d => x(d.YEAR))
            .attr('cy', d => y(d.value))
            .attr('fill', d => colorMap[d.key])
            .attr('opacity', 1);

        points.exit()
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .remove();

        // ----- LEGEND  (always shows both stages) -----
        const legendData = [
            { key: 'stage1', label: stageMeta.stage1.label },
            { key: 'stage3', label: stageMeta.stage3.label }
        ];

        const legendItems = legendGroup.selectAll('.legend-item')
            .data(legendData, d => d.key);

        const legendEnter = legendItems.enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(${i * 220}, -20)`)
            .on('mouseover', (event, d) => {
                if (visibleKeys.includes(d.key)) {
                    highlightStage(d.key);
                }
            })
            .on('mouseout', () => {
                clearHighlight();
            })
            .on('click', (event, d) => {
                // toggle in selection set
                if (selectedStages.has(d.key)) {
                    selectedStages.delete(d.key);
                } else {
                    selectedStages.add(d.key);
                }
                // re-run update with same filters but new selection
                update(currentFilters);
            });

        legendEnter.append('rect')
            .attr('width', 14)
            .attr('height', 14)
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('fill', d => colorMap[d.key]);

        legendEnter.append('text')
            .attr('x', 20)
            .attr('y', 11)
            .attr('font-size', 11)
            .attr('fill', '#374151')
            .text(d => d.label);

        legendItems
            .transition()
            .duration(300)
            .attr('transform', (d, i) => `translate(${i * 220}, -20)`);

        legendItems.exit().remove();

        // Style legend according to selection state
        legendGroup.selectAll('.legend-item').each(function (d) {
            const isActive = selectedStages.size === 0 || selectedStages.has(d.key);
            const isSelected = selectedStages.has(d.key);

            d3.select(this).select('text')
                .attr('font-weight', isSelected ? 'bold' : 'normal')
                .attr('fill', isActive ? '#111827' : '#9ca3af');

            d3.select(this).select('rect')
                .attr('stroke', isSelected ? '#111827' : 'none')
                .attr('stroke-width', isSelected ? 1.5 : 0)
                .attr('opacity', isActive ? 1 : 0.35);
        });

        clearHighlight();
    }

    const jurisdictionFilter = document.getElementById('jurisdiction-filter');
    const yearRange = document.getElementById('year-range');

    const initialJurisdiction = jurisdictionFilter ? jurisdictionFilter.value : 'all';
    const initialYear = yearRange ? +yearRange.value : maxYear;

    update({ jurisdiction: initialJurisdiction, year: initialYear });

    methodsChart = { update };
}


// ===================================
// CHART 3  bar chart Detection rate by age group
// interactive + tooltips
// ===================================

function initChart3() {
    console.log('Initializing Chart 3: Demographics by age group');

    const container = d3.select('#chart-demographics');
    container.select('.chart-placeholder').remove();

    const parent = container.node().getBoundingClientRect();
    const margin = { top: 45, right: 20, bottom: 60, left: 60 };
    const width = parent.width - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand().range([0, width]).padding(0.2);
    const y = d3.scaleLinear().range([height, 0]);

    const xAxisGroup = g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`);

    const yAxisGroup = g.append('g')
        .attr('class', 'y-axis');

    g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 45)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .text('AGE_GROUP');

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .text('Detection Rate (%)');

    const barsGroup = g.append('g').attr('class', 'bars');

    const colorMap = {
        '0-16': '#2563eb',
        '17-25': '#22c55e',
        '26-39': '#facc15',
        '40-64': '#f97316',
        '65 and over': '#38bdf8',
        'All ages': '#16a34a'
    };

    // Re-use tooltip from other charts if present; otherwise create it
    let tooltip = d3.select('body').select('.chart-tooltip-landscape');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'chart-tooltip-landscape')
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('background', 'rgba(15,23,42,0.95)')
            .style('color', '#fff')
            .style('padding', '6px 10px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('box-shadow', '0 4px 10px rgba(15,23,42,0.4)')
            .style('opacity', 0);
    }

    // Track which bar is "focused" by click
    let selectedAgeGroup = null;

    d3.csv('./data/PositiveTestByAgeGroup.csv', d3.autoType).then(ageData => {
        console.log('Age-group data loaded:', ageData);

        const ageGroups = ageData.map(d => d.AGE_GROUP);
        x.domain(ageGroups);

        const maxRate = d3.max(ageData, d => +d.Detection_Rate) || 100;
        y.domain([0, Math.max(100, maxRate)]).nice();

        const xAxis = d3.axisBottom(x);
        const yAxis = d3.axisLeft(y).ticks(8);

        xAxisGroup.call(xAxis)
            .selectAll('text')
            .attr('transform', 'rotate(-20)')
            .style('text-anchor', 'end');

        yAxisGroup.call(yAxis);

        function applySelection() {
            const bars = barsGroup.selectAll('.bar');
            const hasSelection = !!selectedAgeGroup;

            bars
                .attr('opacity', d =>
                    !hasSelection || d.AGE_GROUP === selectedAgeGroup ? 1 : 0.3
                )
                .attr('stroke', d =>
                    d.AGE_GROUP === selectedAgeGroup ? '#111827' : 'none'
                )
                .attr('stroke-width', d =>
                    d.AGE_GROUP === selectedAgeGroup ? 2 : 0
                );
        }

        function render() {
            const bars = barsGroup.selectAll('.bar')
                .data(ageData, d => d.AGE_GROUP);

            const enter = bars.enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('x', d => x(d.AGE_GROUP))
                .attr('width', x.bandwidth())
                .attr('y', height)
                .attr('height', 0)
                .attr('fill', d => colorMap[d.AGE_GROUP] || '#6b7280');

            const merged = enter.merge(bars);

            merged
                .on('mouseover', function (event, d) {
                    // temporary hover highlight
                    d3.select(this)
                        .attr('opacity', 1)
                        .attr('stroke', '#111827')
                        .attr('stroke-width', 2);

                    tooltip
                        .style('opacity', 1)
                        .html(
                            `<strong>${d.AGE_GROUP}</strong><br/>` +
                            `Detection rate: ${d.Detection_Rate.toFixed(1)}%`
                        );

                    const [pageX, pageY] = [event.pageX, event.pageY];
                    tooltip
                        .style('left', (pageX + 12) + 'px')
                        .style('top', (pageY - 28) + 'px');
                })
                .on('mousemove', function (event) {
                    const [pageX, pageY] = [event.pageX, event.pageY];
                    tooltip
                        .style('left', (pageX + 12) + 'px')
                        .style('top', (pageY - 28) + 'px');
                })
                .on('mouseout', function () {
                    tooltip.style('opacity', 0);
                    applySelection();
                })
                .on('click', function (event, d) {
                    // toggle focus on this age group
                    if (selectedAgeGroup === d.AGE_GROUP) {
                        selectedAgeGroup = null;
                    } else {
                        selectedAgeGroup = d.AGE_GROUP;
                    }
                    applySelection();
                })
                .transition()
                .duration(800)
                .attr('x', d => x(d.AGE_GROUP))
                .attr('width', x.bandwidth())
                .attr('y', d => y(d.Detection_Rate))
                .attr('height', d => height - y(d.Detection_Rate))
                .attr('fill', d => colorMap[d.AGE_GROUP] || '#6b7280');

            bars.exit()
                .transition()
                .duration(300)
                .attr('y', height)
                .attr('height', 0)
                .remove();

            applySelection();
        }

        render();

        demographicsChart = {
            update: () => {
                // Currently national-level; filters do not change this chart
                render();
            }
        };
    }).catch(err => {
        console.error('Error loading PositiveTestByAgeGroup.csv:', err);
    });
}


// ===================================
// CHART 4  grouped bar Before/During/After COVID by jurisdiction
// interactive + tooltips + legend filter
// ===================================

function initChart4() {
    console.log('Initializing Chart 4: COVID impact Before / During / After');

    const container = d3.select('#chart-covid');
    container.select('.chart-placeholder').remove();

    const parent = container.node().getBoundingClientRect();
    const margin = { top: 60, right: 20, bottom: 60, left: 70 };
    const width = parent.width - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x0 = d3.scaleBand().range([0, width]).paddingInner(0.25);
    const x1 = d3.scaleBand().padding(0.05);   // range set later per visible jurs
    const y = d3.scaleLinear().range([height, 0]);

    const xAxisGroup = g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`);

    const yAxisGroup = g.append('g')
        .attr('class', 'y-axis');

    g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 45)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .text('COVID period');

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -55)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .text('Number of Positive Tests');

    g.append('text')
        .attr('x', 0)
        .attr('y', -30)
        .attr('font-size', 11)
        .attr('fill', '#6b7280')
        .text('Note: Before COVID (2018–2019), During COVID (2020–2021), After COVID (2022–2024)');

    const legendGroup = g.append('g')
        .attr('class', 'covid-legend')
        .attr('transform', 'translate(0,-10)');

    const barsGroup = g.append('g').attr('class', 'bars');

    const periods = [
        { key: 'After COVID', column: 'After COVID+Sum(COUNT)' },
        { key: 'Before COVID', column: 'Before COVID+Sum(COUNT)' },
        { key: 'During COVID', column: 'During COVID+Sum(COUNT)' }
    ];

    // Tooltip (reuse from other charts if present)
    let tooltip = d3.select('body').select('.chart-tooltip-landscape');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'chart-tooltip-landscape')
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('background', 'rgba(15,23,42,0.95)')
            .style('color', '#fff')
            .style('padding', '6px 10px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('box-shadow', '0 4px 10px rgba(15,23,42,0.4)')
            .style('opacity', 0);
    }

    const selectedJurisdictions = new Set();   // legend multi-select
    let currentFilterJurisdiction = 'all';     // dropdown filter

    d3.csv('./data/YearByJurisdiction.csv', d3.autoType).then(covidData => {
        console.log('YearByJurisdiction data loaded:', covidData);

        const jurisdictions = covidData.map(d => d.JURISDICTION);

        const flatData = [];
        periods.forEach(p => {
            covidData.forEach(row => {
                flatData.push({
                    period: p.key,
                    jurisdiction: row.JURISDICTION,
                    value: row[p.column] || 0
                });
            });
        });

        x0.domain(periods.map(p => p.key));

        const maxValue = d3.max(flatData, d => d.value) || 0;
        y.domain([0, maxValue]).nice();

        const xAxis = d3.axisBottom(x0);
        const yAxis = d3.axisLeft(y).ticks(8).tickFormat(d => formatNumber(d));

        xAxisGroup.call(xAxis);
        yAxisGroup.call(yAxis);

        // Legend
        const legendItems = legendGroup.selectAll('.legend-item')
            .data(jurisdictions, d => d);

        const legendEnter = legendItems.enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => {
                const row = Math.floor(i / 4);
                const col = i % 4;
                return `translate(${col * 120}, ${row * 18})`;
            })
            .on('mouseover', (event, d) => {
                barsGroup.selectAll('rect')
                    .attr('opacity', b => b.jurisdiction === d ? 1 : 0.2);
            })
            .on('mouseout', () => {
                applySelectionStyling();
            })
            .on('click', (event, d) => {
                if (selectedJurisdictions.has(d)) {
                    selectedJurisdictions.delete(d);
                } else {
                    selectedJurisdictions.add(d);
                }
                render(currentFilterJurisdiction);
            });

        legendEnter.append('rect')
            .attr('width', 10)
            .attr('height', 10)
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('fill', d => getJurisdictionColor(d));

        legendEnter.append('text')
            .attr('x', 16)
            .attr('y', 9)
            .attr('font-size', 11)
            .attr('fill', '#374151')
            .text(d => d);

        legendItems.exit().remove();

        function applySelectionStyling() {
            const hasSelection = selectedJurisdictions.size > 0;

            barsGroup.selectAll('rect')
                .attr('opacity', d => {
                    const passLegend = !hasSelection || selectedJurisdictions.has(d.jurisdiction);
                    const passFilter = currentFilterJurisdiction === 'all' ||
                        d.jurisdiction === currentFilterJurisdiction;
                    return passLegend && passFilter ? 1 : 0.25;
                });

            legendGroup.selectAll('.legend-item').each(function (d) {
                const isSelected = selectedJurisdictions.has(d);
                const isActive = !hasSelection || isSelected;

                d3.select(this).select('text')
                    .attr('font-weight', isSelected ? 'bold' : 'normal')
                    .attr('fill', isActive ? '#111827' : '#9ca3af');

                d3.select(this).select('rect')
                    .attr('stroke', isSelected ? '#111827' : 'none')
                    .attr('stroke-width', isSelected ? 1.5 : 0)
                    .attr('opacity', isActive ? 1 : 0.35);
            });
        }

        function render(filterJurisdiction = 'all') {
            currentFilterJurisdiction = filterJurisdiction;

            const hasSelection = selectedJurisdictions.size > 0;

            const visibleData = flatData.filter(d => {
                const passFilter = filterJurisdiction === 'all' || d.jurisdiction === filterJurisdiction;
                const passLegend = !hasSelection || selectedJurisdictions.has(d.jurisdiction);
                return passFilter && passLegend;
            });

            // NEW: recompute x1 domain based on *visible* jurisdictions
            const visibleJurs = Array.from(new Set(visibleData.map(d => d.jurisdiction)));
            if (visibleJurs.length === 0) {
                barsGroup.selectAll('rect').data([]).exit().remove();
                applySelectionStyling();
                return;
            }
            x1.domain(visibleJurs).range([0, x0.bandwidth()]);

            const bars = barsGroup.selectAll('rect')
                .data(visibleData, d => `${d.period}-${d.jurisdiction}`);

            const enter = bars.enter()
                .append('rect')
                .attr('x', d => x0(d.period) + x1(d.jurisdiction))
                .attr('width', x1.bandwidth())
                .attr('y', height)
                .attr('height', 0)
                .attr('fill', d => getJurisdictionColor(d.jurisdiction))
                .attr('opacity', 0.9);

            enter.merge(bars)
                .on('mouseover', function (event, d) {
                    barsGroup.selectAll('rect')
                        .attr('opacity', b =>
                            (b.period === d.period && b.jurisdiction === d.jurisdiction) ? 1 : 0.2
                        );

                    tooltip
                        .style('opacity', 1)
                        .html(
                            `<strong>${d.jurisdiction}</strong><br/>` +
                            `${d.period}<br/>` +
                            `Positive tests: ${formatNumber(d.value)}`
                        );

                    const [pageX, pageY] = [event.pageX, event.pageY];
                    tooltip
                        .style('left', (pageX + 12) + 'px')
                        .style('top', (pageY - 28) + 'px');
                })
                .on('mousemove', function (event) {
                    const [pageX, pageY] = [event.pageX, event.pageY];
                    tooltip
                        .style('left', (pageX + 12) + 'px')
                        .style('top', (pageY - 28) + 'px');
                })
                .on('mouseout', function () {
                    tooltip.style('opacity', 0);
                    applySelectionStyling();
                })
                .transition()
                .duration(800)
                .attr('x', d => x0(d.period) + x1(d.jurisdiction))
                .attr('width', x1.bandwidth())
                .attr('y', d => y(d.value))
                .attr('height', d => height - y(d.value))
                .attr('fill', d => getJurisdictionColor(d.jurisdiction));

            bars.exit()
                .transition()
                .duration(300)
                .attr('y', height)
                .attr('height', 0)
                .remove();

            applySelectionStyling();
        }

        const jFilter = document.getElementById('jurisdiction-filter');
        const initialJurisdiction = jFilter ? jFilter.value : 'all';
        render(initialJurisdiction);

        covidChart = {
            update: ({ jurisdiction }) => {
                render(jurisdiction || 'all');
            }
        };
    }).catch(err => {
        console.error('Error loading YearByJurisdiction.csv:', err);
    });
}


// ===================================
// PLACEHOLDER FOR CHART 5
// ===================================

function initChart5(data) {
    console.log('Initializing Chart 5: Actionable Insights');
    const container = d3.select('#chart-insights');
    container.select('.chart-placeholder').remove();
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
        exploreBtn.addEventListener('click', function() {
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
