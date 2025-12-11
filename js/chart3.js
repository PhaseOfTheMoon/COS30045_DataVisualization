// CHART 3 - bar chart Detection rate by age group

(function () {
    window.initChart3 = function initChart3() {
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

        // Re-use tooltip from chart 1
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

            // Expose a stub update so the filters can call it
            demographicsChart = {
                update: () => {
                    // Currently national-level, the filters do not change this chart
                    render();
                }
            };
        }).catch(err => {
            console.error('Error loading PositiveTestByAgeGroup.csv:', err);
        });
    };
})();
