// CHART 8: ENFORCEMENT SEVERITY BY JURISDICTION

function drawChart8Severity(data) {
    console.log('Chart 8: Initializing with', data.length, 'records');
    console.log('Chart 8: Sample data:', data[0]);

    const margin = { top: 40, right: 120, bottom: 60, left: 80 };
    const container = d3.select("#chart-8-severity");

    const svg = container.append("svg")
        .attr("viewBox", `0 0 1100 500`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const width = 1100 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // TOOLTIP SETUP

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "10px")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "#fff")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-size", "12px");

    const jurisdictionColors = {
        'ACT': '#6366f1',
        'NSW': '#10b981',
        'NT': '#f59e0b',
        'QLD': '#ef4444',
        'SA': '#0891b2',
        'TAS': '#10b981',
        'VIC': '#f97316',
        'WA': '#8b5cf6'
    };

    const colorScale = d3.scaleOrdinal()
        .domain(Object.keys(jurisdictionColors))
        .range(Object.values(jurisdictionColors));

    // DATA PROCESSING
    const grouped = d3.group(data, d => d.JURISDICTION);

    const processedData = Array.from(grouped, ([jurisdiction, rows]) => {
        const result = { jurisdiction: jurisdiction };
        rows.forEach(row => {
            // Map column names to simpler keys
            if (row.ColumnNames === "Sum(ARRESTS)") result.arrests = row.ColumnValues;
            if (row.ColumnNames === "Sum(FINES)") result.fines = row.ColumnValues;
            if (row.ColumnNames === "Sum(CHARGES)") result.charges = row.ColumnValues;
        });
        return result;
    });

    console.log('Chart 8: Processed data:', processedData);

    drawChart(processedData);


    function drawChart(data) {
        const enforcementTypes = ['arrests', 'fines', 'charges'];
        const enforcementLabels = {
            'arrests': 'Arrests',
            'fines': 'Fines',
            'charges': 'Charges'
        };

        const x0Scale = d3.scaleBand()
            .domain(enforcementTypes)
            .range([0, width])
            .padding(0.2);

        const x1Scale = d3.scaleBand()
            .domain(data.map(d => d.jurisdiction))
            .range([0, x0Scale.bandwidth()])
            .padding(0.05);

        const yMax = d3.max(data, d => Math.max(d.fines, d.arrests, d.charges));
        const yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([height, 0])
            .nice();

        // X-axis
        const xAxis = d3.axisBottom(x0Scale)
            .tickFormat(d => enforcementLabels[d]);

        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "13px")
            .style("font-weight", "600");

        // X-axis label
        g.append("text")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .attr("text-anchor", "middle")
            .attr("fill", "#374151")
            .attr("font-size", "14px")
            .attr("font-weight", "600")
            .text("Enforcement Type");

        // Y-axis
        const yAxis = d3.axisLeft(yScale)
            .ticks(8)
            .tickFormat(d => d3.format(",.0f")(d));

        g.append("g")
            .attr("class", "y-axis")
            .call(yAxis)
            .selectAll("text")
            .style("font-size", "12px");

        // Y-axis label
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -60)
            .attr("text-anchor", "middle")
            .attr("fill", "#374151")
            .attr("font-size", "14px")
            .attr("font-weight", "600")
            .text("Total Count");

        g.append("g")
            .attr("class", "grid")
            .attr("opacity", 0.1)
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat(""));

        const enforcementGroups = g.selectAll(".enforcement-group")
            .data(enforcementTypes)
            .join("g")
            .attr("class", "enforcement-group")
            .attr("transform", d => `translate(${x0Scale(d)},0)`);

        enforcementGroups.each(function(enforcementType) {
            const group = d3.select(this);

            group.selectAll(".bar")
                .data(data)
                .join("rect")
                .attr("class", "bar")
                .attr("x", d => x1Scale(d.jurisdiction))
                .attr("y", height) 
                .attr("width", x1Scale.bandwidth())
                .attr("height", 0) 
                .attr("fill", d => colorScale(d.jurisdiction))
                .attr("opacity", 0.8)
                .style("cursor", "pointer")
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("opacity", 1);

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 1);

                    tooltip.html(`
                        <strong>${d.jurisdiction}</strong><br/>
                        ${enforcementLabels[enforcementType]}: <strong>${d3.format(",")(d[enforcementType])}</strong>
                    `)
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("opacity", 0.8);

                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
                .transition()
                .duration(800)
                .delay((d, i) => i * 50)
                .attr("y", d => yScale(d[enforcementType]))
                .attr("height", d => height - yScale(d[enforcementType]));
        });

        const legend = g.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width + 20}, 0)`);

        legend.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "#374151")
            .text("Jurisdiction");

        const jurisdictions = data.map(d => d.jurisdiction).sort();

        const legendItems = legend.selectAll(".legend-item")
            .data(jurisdictions)
            .join("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20 + 15})`);

        legendItems.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", d => colorScale(d))
            .attr("opacity", 0.8);

        legendItems.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .attr("font-size", "11px")
            .attr("fill", "#374151")
            .text(d => d);
    }
}
