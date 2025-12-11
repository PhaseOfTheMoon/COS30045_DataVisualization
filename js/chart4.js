// CHART 4 - Stacked Treemap with Legend Filtering (Inline Values + Better Labels)

(function () {
    const {
        formatNumber,
        getJurisdictionColor
    } = window.dashboardUtils || {};

    window.initChart4 = function initChart4() {
        console.log("Initializing Chart 4: stacked treemap with inline values");

        const container = d3.select("#chart-covid");
        container.select(".chart-placeholder").remove();

        const parent = container.node().getBoundingClientRect();

        const margin = { top: 90, right: 20, bottom: 60, left: 20 };
        const width = parent.width - margin.left - margin.right;

        const rowHeight = 220;
        const numRows = 3;
        const innerHeight = numRows * (rowHeight + 60) + 40;
        const svgHeight = margin.top + margin.bottom + innerHeight;

        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", svgHeight);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Notes above legend
        g.append("text")
            .attr("x", 0)
            .attr("y", -40)
            .attr("font-size", 12)
            .attr("fill", "#6b7280")
            .text("Note: Before COVID (2018–2019), During COVID (2020–2021), After COVID (2022–2024)");
            

        g.append("text")
            .attr("x", 0)
            .attr("y", -22)
            .attr("font-size", 11)
            .attr("fill", "#9ca3af")
            .text("");

        const legendGroup = g.append("g")
            .attr("class", "covid-legend")
            .attr("transform", "translate(0,-15)");

        const periods = [
            { label: "Before COVID", column: "Before COVID+Sum(COUNT)" },
            { label: "After COVID", column: "After COVID+Sum(COUNT)" },
            { label: "During COVID", column: "During COVID+Sum(COUNT)" }
        ];

        const selectedJurisdictions = new Set();
        let currentFilterJurisdiction = "all";

        d3.csv("./data/YearByJurisdiction.csv", d3.autoType).then(data => {
            const jurisdictions = Array.from(new Set(data.map(d => d.JURISDICTION)));

            // ---------- LEGEND (single horizontal line) ----------
            const legendItems = legendGroup.selectAll(".legend-item")
                .data(jurisdictions)
                .enter()
                .append("g")
                .attr("class", "legend-item")
                .attr("transform", (d, i) => `translate(${i * 90}, 0)`);

            legendItems.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("fill", d => getJurisdictionColor(d));

            legendItems.append("text")
                .attr("x", 14)
                .attr("y", 9)
                .attr("font-size", 11)
                .attr("fill", "#111827")
                .text(d => d);

            function updateLegendStyles() {
                const hasSelection = selectedJurisdictions.size > 0;

                legendGroup.selectAll(".legend-item").each(function (d) {
                    const isSelected = selectedJurisdictions.has(d);
                    const isActive = !hasSelection || isSelected;

                    d3.select(this).select("text")
                        .attr("font-weight", isSelected ? "bold" : "normal")
                        .attr("fill", isActive ? "#111827" : "#9ca3af");

                    d3.select(this).select("rect")
                        .attr("stroke", isSelected ? "#111827" : "none")
                        .attr("stroke-width", isSelected ? 1.5 : 0)
                        .attr("opacity", isActive ? 1 : 0.4);
                });
            }

            legendItems.on("click", (event, d) => {
                if (selectedJurisdictions.has(d)) {
                    selectedJurisdictions.delete(d);
                } else {
                    selectedJurisdictions.add(d);
                }
                updateLegendStyles();
                render(currentFilterJurisdiction);
            });

            updateLegendStyles();

            // Tree Map 
            function drawTreemapBlock(yOffset, title, values) {
                const block = g.append("g")
                    .attr("class", "treemap-block")
                    .attr("transform", `translate(0, ${yOffset})`);

                block.append("text")
                    .attr("y", -10)
                    .attr("font-size", 15)
                    .attr("font-weight", "600")
                    .text(title);

                if (!values.length) {
                    block.append("text")
                        .attr("x", 10)
                        .attr("y", 20)
                        .attr("font-size", 12)
                        .attr("fill", "#9ca3af")
                        .text("No data for current filters.");
                    return;
                }

                const treemapLayout = d3.treemap()
                    .size([width, rowHeight])
                    .padding(4);

                const root = d3.hierarchy({
                    children: values.map(v => ({
                        name: v.JURISDICTION,
                        jurisdiction: v.JURISDICTION,
                        value: v.value,
                        scaled: Math.sqrt(v.value || 0)
                    }))
                })
                    .sum(d => d.scaled)
                    .sort((a, b) => (b.value || 0) - (a.value || 0));

                treemapLayout(root);

                const nodes = block.selectAll(".node")
                    .data(root.leaves())
                    .enter()
                    .append("g")
                    .attr("class", "node")
                    .attr("transform", d => `translate(${d.x0}, ${d.y0})`);

                nodes.append("rect")
                    .attr("width", d => d.x1 - d.x0)
                    .attr("height", d => d.y1 - d.y0)
                    .attr("fill", d => getJurisdictionColor(d.data.jurisdiction))
                    .attr("stroke", "#ffffff")
                    .attr("stroke-width", 1);

                nodes.each(function (d) {
                    const group = d3.select(this);
                    const w = d.x1 - d.x0;
                    const h = d.y1 - d.y0;

                    const jurisdiction = d.data.jurisdiction;
                    const valueLabel = formatNumber(d.data.value);
                    const fontFamily = "Inter, Segoe UI, system-ui, sans-serif";

                    // Makes small boxes (ACT, NT) more readable
                    if (w < 55 || h < 40) {
                        group.append("text")
                            .attr("x", 4)
                            .attr("y", 14)
                            .attr("font-size", 11)
                            .attr("font-family", fontFamily)
                            .attr("font-weight", 600)
                            .attr("fill", "#111")
                            .style("text-shadow", "0 1px 2px rgba(255,255,255,0.6)")
                            .text(jurisdiction);

                        group.append("text")
                            .attr("x", 4)
                            .attr("y", 28)
                            .attr("font-size", 10)
                            .attr("font-family", fontFamily)
                            .attr("fill", "#111")
                            .style("text-shadow", "0 1px 2px rgba(255,255,255,0.7)")
                            .text(valueLabel);

                        return;
                    }

                    group.append("text")
                        .attr("x", 8)
                        .attr("y", 18)
                        .attr("font-size", 14)
                        .attr("font-weight", 700)
                        .attr("font-family", fontFamily)
                        .attr("fill", "#111")
                        .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)")
                        .text(jurisdiction);

                    group.append("text")
                        .attr("x", 8)
                        .attr("y", 36)
                        .attr("font-size", 12)
                        .attr("font-weight", 600)
                        .attr("font-family", fontFamily)
                        .attr("fill", "#111")
                        .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)")
                        .text(valueLabel);
                });

            }

            // Render all three treemaps
            function render(jurisdictionFilter = "all") {
                currentFilterJurisdiction = jurisdictionFilter;

                g.selectAll(".treemap-block").remove();

                let offset = 40; 

                const hasSelection = selectedJurisdictions.size > 0;

                periods.forEach(p => {
                    const rawValues = data.map(d => ({
                        JURISDICTION: d.JURISDICTION,
                        value: d[p.column] || 0
                    }));

                    const filteredValues = rawValues.filter(v => {
                        const passJurFilter =
                            jurisdictionFilter === "all" ||
                            v.JURISDICTION === jurisdictionFilter;

                        const passLegend =
                            !hasSelection || selectedJurisdictions.has(v.JURISDICTION);

                        return passJurFilter && passLegend && v.value > 0;
                    });

                    drawTreemapBlock(offset, p.label, filteredValues);
                    offset += rowHeight + 60;
                });
            }

            const jFilter = document.getElementById("jurisdiction-filter");
            const initialJurisdiction = jFilter ? jFilter.value : "all";
            render(initialJurisdiction);

            covidChart = {
                update: ({ jurisdiction }) => {
                    render(jurisdiction || "all");
                }
            };
        });
    };
})();
