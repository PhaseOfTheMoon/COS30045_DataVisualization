// CHART 1 - multi series line chart

(function () {
    const {
        formatNumber,
        getJurisdictionColor
    } = window.dashboardUtils || {};

    // rawData comes from loadData() in main.js
    window.initChart1 = function initChart1(rawData) {
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

        // Tooltip div for each page
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

            // LINES (only visibleSeries) 
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

            // POINT MARKERS (only visibleSeries)
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

            // LEGEND to always show ALL jurisdictions that pass top filter
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
                    // toggle the selection
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

            // style legend text or swatches based on selection
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

        // Uses global variable from main.js
        landscapeChart = { update };
    };
})();
