// ===================================
// CHART 2 - Overlapping Area Chart by Detection Method
// Stage 1 vs Stage 3 (Entries/Exits style)
// ===================================

(function () {
    const {
        formatNumber,
        getJurisdictionColor
    } = window.dashboardUtils || {};

    window.initChart2 = function initChart2(rawData) {
        console.log("Initializing Chart 2: Overlapping area chart by detection method");

        const container = d3.select("#chart-methods");
        container.select(".chart-placeholder").remove();

        const parent = container.node().getBoundingClientRect();
        const margin = { top: 50, right: 90, bottom: 45, left: 70 };

        const width = parent.width - margin.left - margin.right;
        const height = 420 - margin.top - margin.bottom;

        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Tooltip (shared with chart 1 if already created)
        let tooltip = d3.select("body").select(".chart-tooltip-landscape");
        if (tooltip.empty()) {
            tooltip = d3.select("body")
                .append("div")
                .attr("class", "chart-tooltip-landscape")
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("background", "rgba(15,23,42,0.95)")
                .style("color", "#fff")
                .style("padding", "6px 10px")
                .style("border-radius", "4px")
                .style("font-size", "12px")
                .style("box-shadow", "0 4px 10px rgba(15,23,42,0.4)")
                .style("opacity", 0);
        }

        // --- Data prep: only positive_drug_tests + two methods ---
        const filteredBase = rawData.filter(d =>
            d.YEAR != null &&
            d.DETECTION_METHOD &&
            d.COUNT != null &&
            !isNaN(d.COUNT) &&
            d.METRIC === "positive_drug_tests"
        );

        // Use years from the whole dataset so the axis can reach 2024 even if some methods don't
        const allYearsGlobal = rawData
            .map(d => +d.YEAR)
            .filter(y => !isNaN(y));

        const minYear = d3.min(allYearsGlobal);
        const maxYear = d3.max(allYearsGlobal);

        const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);

        const xAxisGroup = g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`);

        const yAxisGroup = g.append("g")
            .attr("class", "y-axis");

        g.append("text")
            .attr("x", width / 2)
            .attr("y", height + 38)
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .text("YEAR");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .text("Number of Positive Tests by Method");

        const areasGroup = g.append("g").attr("class", "areas");
        const linesGroup = g.append("g").attr("class", "lines");
        const pointsGroup = g.append("g").attr("class", "method-points");
        const legendGroup = g.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(0,-20)");

        // Colors for methods
        const colorMap = {
            stage1: getJurisdictionColor("NSW"), // blue-ish
            stage3: getJurisdictionColor("QLD")  // orange-ish
        };

        const stageMeta = {
            stage1: {
                key: "stage1",
                label: "Stage 1 Screening tests",
                matches: m => m === "Indicator (Stage 1)"
            },
            stage3: {
                key: "stage3",
                label: "Stage 3 Laboratory confirmation",
                matches: m => m === "Laboratory or Toxicology (Stage 3)"
            }
        };

        const activeStages = new Set(["stage1", "stage3"]);
        let currentFilters = { jurisdiction: "all", year: maxYear };

        // Aggregate data by year for selected jurisdiction and year
        function aggregateData(jurisdiction, year) {
            const maxYearShown = +year;  // <-- no more clamping to data max
            const rows = [];

            for (let yVal = minYear; yVal <= maxYearShown; yVal++) {
                const rowsForYear = filteredBase.filter(d =>
                    +d.YEAR === yVal &&
                    (jurisdiction === "all" || d.JURISDICTION === jurisdiction)
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

        // Area + line generators
        const areaStage1 = d3.area()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.YEAR))
            .y0(height)
            .y1(d => y(d.stage1));

        const areaStage3 = d3.area()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.YEAR))
            .y0(height)
            .y1(d => y(d.stage3));

        const lineStage1 = d3.line()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.YEAR))
            .y(d => y(d.stage1));

        const lineStage3 = d3.line()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.YEAR))
            .y(d => y(d.stage3));

        function update({ jurisdiction = "all", year = maxYear } = {}) {
            currentFilters = { jurisdiction, year };

            const dataWide = aggregateData(jurisdiction, year);
            if (!dataWide.length) return;

            x.domain([minYear, +year]);

            let maxVal = d3.max(dataWide, d => Math.max(d.stage1, d.stage3)) || 0;
            y.domain([0, maxVal]).nice();

            const xAxis = d3.axisBottom(x)
                .ticks(10)
                .tickFormat(d3.format("d"));

            const yAxis = d3.axisLeft(y)
                .ticks(8)
                .tickFormat(d => formatNumber(d));

            xAxisGroup.transition().duration(600).call(xAxis);
            yAxisGroup.transition().duration(600).call(yAxis);

            // --- Areas ---
            const area1 = areasGroup.selectAll(".area-stage1")
                .data(activeStages.has("stage1") ? [dataWide] : []);

            area1.enter()
                .append("path")
                .attr("class", "area-stage1")
                .attr("fill", colorMap.stage1)
                .attr("fill-opacity", 0.35)
                .attr("stroke", "none")
                .merge(area1)
                .transition()
                .duration(800)
                .attr("d", areaStage1);

            area1.exit()
                .transition()
                .duration(300)
                .style("opacity", 0)
                .remove();

            const area2 = areasGroup.selectAll(".area-stage3")
                .data(activeStages.has("stage3") ? [dataWide] : []);

            area2.enter()
                .append("path")
                .attr("class", "area-stage3")
                .attr("fill", colorMap.stage3)
                .attr("fill-opacity", 0.35)
                .attr("stroke", "none")
                .merge(area2)
                .transition()
                .duration(800)
                .attr("d", areaStage3);

            area2.exit()
                .transition()
                .duration(300)
                .style("opacity", 0)
                .remove();

            // --- Lines ---
            const line1 = linesGroup.selectAll(".line-stage1")
                .data(activeStages.has("stage1") ? [dataWide] : []);

            line1.enter()
                .append("path")
                .attr("class", "line-stage1")
                .attr("fill", "none")
                .attr("stroke", colorMap.stage1)
                .attr("stroke-width", 2)
                .merge(line1)
                .transition()
                .duration(800)
                .attr("d", lineStage1);

            line1.exit()
                .transition()
                .duration(300)
                .style("opacity", 0)
                .remove();

            const line2 = linesGroup.selectAll(".line-stage3")
                .data(activeStages.has("stage3") ? [dataWide] : []);

            line2.enter()
                .append("path")
                .attr("class", "line-stage3")
                .attr("fill", "none")
                .attr("stroke", colorMap.stage3)
                .attr("stroke-width", 2)
                .merge(line2)
                .transition()
                .duration(800)
                .attr("d", lineStage3);

            line2.exit()
                .transition()
                .duration(300)
                .style("opacity", 0)
                .remove();

            // --- Points & tooltip ---
            const flattenedPoints = [];
            if (activeStages.has("stage1")) {
                dataWide.forEach(row => {
                    if (row.stage1 > 0) {
                        flattenedPoints.push({
                            YEAR: row.YEAR,
                            value: row.stage1,
                            key: "stage1"
                        });
                    }
                });
            }
            if (activeStages.has("stage3")) {
                dataWide.forEach(row => {
                    if (row.stage3 > 0) {
                        flattenedPoints.push({
                            YEAR: row.YEAR,
                            value: row.stage3,
                            key: "stage3"
                        });
                    }
                });
            }

            const points = pointsGroup.selectAll(".method-point")
                .data(flattenedPoints, d => `${d.key}-${d.YEAR}`);

            const pointsEnter = points.enter()
                .append("circle")
                .attr("class", "method-point")
                .attr("r", 3)
                .attr("cx", d => x(d.YEAR))
                .attr("cy", d => y(d.value))
                .attr("fill", d => colorMap[d.key])
                .attr("opacity", 0);

            pointsEnter.merge(points)
                .on("mouseover", function (event, d) {
                    tooltip
                        .style("opacity", 1)
                        .html(
                            `<strong>${stageMeta[d.key].label}</strong><br/>` +
                            `Year: ${d.YEAR}<br/>` +
                            `Positive tests: ${formatNumber(d.value)}`
                        );

                    const [pageX, pageY] = [event.pageX, event.pageY];
                    tooltip
                        .style("left", (pageX + 12) + "px")
                        .style("top", (pageY - 28) + "px");
                })
                .on("mousemove", function (event) {
                    const [pageX, pageY] = [event.pageX, event.pageY];
                    tooltip
                        .style("left", (pageX + 12) + "px")
                        .style("top", (pageY - 28) + "px");
                })
                .on("mouseout", function () {
                    tooltip.style("opacity", 0);
                })
                .transition()
                .duration(800)
                .attr("cx", d => x(d.YEAR))
                .attr("cy", d => y(d.value))
                .attr("opacity", 1);

            points.exit()
                .transition()
                .duration(300)
                .attr("opacity", 0)
                .remove();
        }

        // Legend
        const legendData = [
            { key: "stage1", label: stageMeta.stage1.label },
            { key: "stage3", label: stageMeta.stage3.label }
        ];

        const legendItems = legendGroup.selectAll(".legend-item")
            .data(legendData, d => d.key)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(${i * 260}, 0)`)
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                if (activeStages.has(d.key)) {
                    activeStages.delete(d.key);
                } else {
                    activeStages.add(d.key);
                }
                updateLegendStyles();
                update(currentFilters);
            });

        legendItems.append("rect")
            .attr("width", 14)
            .attr("height", 14)
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("fill", d => colorMap[d.key]);

        legendItems.append("text")
            .attr("x", 20)
            .attr("y", 11)
            .attr("font-size", 11)
            .attr("fill", "#111827")
            .text(d => d.label);

        function updateLegendStyles() {
            legendGroup.selectAll(".legend-item").each(function (d) {
                const isActive = activeStages.has(d.key);
                d3.select(this).select("text")
                    .attr("font-weight", isActive ? "bold" : "normal")
                    .attr("fill", isActive ? "#111827" : "#9ca3af");

                d3.select(this).select("rect")
                    .attr("stroke", isActive ? "#111827" : "none")
                    .attr("stroke-width", isActive ? 1.5 : 0)
                    .attr("opacity", isActive ? 1 : 0.35);
            });
        }

        updateLegendStyles();

        // Initial render
        const jurisdictionFilter = document.getElementById("jurisdiction-filter");
        const yearRange = document.getElementById("year-range");

        const initialJurisdiction = jurisdictionFilter ? jurisdictionFilter.value : "all";
        const initialYear = yearRange ? +yearRange.value : maxYear;

        update({ jurisdiction: initialJurisdiction, year: initialYear });

        methodsChart = {
            update: ({ jurisdiction, year }) => {
                update({
                    jurisdiction: jurisdiction || "all",
                    year: year || maxYear
                });
            }
        };
    };
})();
