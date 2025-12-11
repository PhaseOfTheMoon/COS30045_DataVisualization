// CHART 7: ENFORCEMENT RESPONSE CORRELATION HEATMAP

function drawChart7Heatmap(rawData) {
    console.log('Chart 7: Initializing with', rawData.length, 'records');
    console.log('Chart 7: Sample data:', rawData.slice(0, 3));

    const margin = { top: 60, right: 120, bottom: 80, left: 120 };
    const container = d3.select("#chart-7-correlation");

    container.select(".chart-placeholder").remove();

    // Create responsive SVG with viewBox
    const svg = container.append("svg")
        .attr("viewBox", `0 0 1100 500`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Calculate inner dimensions
    const width = 1100 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "chart7-tooltip")
        .style("position", "absolute")
        .style("padding", "12px")
        .style("background", "rgba(0, 0, 0, 0.85)")
        .style("color", "#fff")
        .style("border-radius", "6px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-size", "13px")
        .style("box-shadow", "0 4px 6px rgba(0,0,0,0.3)")
        .style("z-index", 10000);

    // DATA PROCESSING
    const processedData = processDataForHeatmap(rawData);

    console.log('Chart 7: Processed heatmap data:', processedData);

    // Draw heatmap
    drawHeatmap(processedData);

    function processDataForHeatmap(data) {
        const heatmapData = [];

        const enforcementTypes = ['FINES', 'ARRESTS', 'CHARGES'];

        const jurisdictions = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

        enforcementTypes.forEach(enfType => {
            jurisdictions.forEach(jurisdiction => {
                const filtered = data.filter(d =>
                    d.JURISDICTION === jurisdiction
                );

                if (filtered.length === 0) {
                    heatmapData.push({
                        enforcement: enfType,
                        jurisdiction: jurisdiction,
                        value: 0,
                        count: 0
                    });
                    return;
                }

                // Calculate average positive test prediction based on enforcement type
                let sum = 0;
                let count = 0;

                filtered.forEach(d => {
                    if (enfType === 'FINES' && d.FINES > 0) {
                        sum += d.prediction;
                        count++;
                    } else if (enfType === 'ARRESTS' && d.ARRESTS > 0) {
                        sum += d.prediction;
                        count++;
                    } else if (enfType === 'CHARGES' && d.CHARGES > 0) {
                        sum += d.prediction;
                        count++;
                    }
                });

                // Calculate average (or 0 if no data)
                const avgValue = count > 0 ? sum / count : 0;

                heatmapData.push({
                    enforcement: enfType,
                    jurisdiction: jurisdiction,
                    value: avgValue,
                    count: count
                });
            });
        });

        return heatmapData;
    }

    // Heatmap
    function drawHeatmap(data) {
        const enforcementTypes = ['FINES', 'ARRESTS', 'CHARGES'];
        const jurisdictions = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

        const cellWidth = width / jurisdictions.length;
        const cellHeight = height / enforcementTypes.length;

        // Color scale setup
        const maxValue = d3.max(data, d => d.value) || 1;
        const minValue = 0;

        const colorScale = d3.scaleSequential()
            .domain([minValue, maxValue])
            .interpolator(d3.interpolateBlues);

        const xScale = d3.scaleBand()
            .domain(jurisdictions)
            .range([0, width])
            .padding(0.05);

        const xAxis = g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${height + 5})`);

        xAxis.selectAll("text")
            .data(jurisdictions)
            .join("text")
            .attr("x", d => xScale(d) + xScale.bandwidth() / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "600")
            .attr("fill", "#374151")
            .text(d => d);

        // X-axis label
        g.append("text")
            .attr("x", width / 2)
            .attr("y", height + 55)
            .attr("text-anchor", "middle")
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("fill", "#1f2937")
            .text("Jurisdiction");

        const yScale = d3.scaleBand()
            .domain(enforcementTypes)
            .range([0, height])
            .padding(0.05);

        const yAxis = g.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(-5, 0)`);

        yAxis.selectAll("text")
            .data(enforcementTypes)
            .join("text")
            .attr("x", -10)
            .attr("y", d => yScale(d) + yScale.bandwidth() / 2)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "600")
            .attr("fill", "#374151")
            .text(d => d.charAt(0) + d.slice(1).toLowerCase());

        // Y-axis label
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -80)
            .attr("text-anchor", "middle")
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("fill", "#1f2937")
            .text("Enforcement Type");

        const cells = g.selectAll(".heatmap-cell")
            .data(data)
            .join("rect")
            .attr("class", "heatmap-cell")
            .attr("x", d => xScale(d.jurisdiction))
            .attr("y", d => yScale(d.enforcement))
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.value))
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("opacity", 0)
            .style("cursor", "pointer")
            // Hover interactions
            .on("mouseover", function(event, d) {
                // Highlight cell
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("stroke", "#1f2937")
                    .attr("stroke-width", 3)
                    .attr("opacity", 1);

                // Show tooltip
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);

                tooltip.html(`
                    <strong>${d.jurisdiction} - ${d.enforcement.charAt(0) + d.enforcement.slice(1).toLowerCase()}</strong><br/>
                    Average Prediction: <strong>${d.value.toFixed(3)}</strong><br/>
                    Sample Size: <strong>${d3.format(",")(d.count)}</strong> records
                `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                // Reset cell
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 2)
                    .attr("opacity", 0.9);

                // Hide tooltip
                tooltip.transition()
                    .duration(300)
                    .style("opacity", 0);
            })
            .transition()
            .duration(600)
            .delay((d, i) => i * 30)
            .attr("opacity", 0.9);

        g.selectAll(".cell-text")
            .data(data)
            .join("text")
            .attr("class", "cell-text")
            .attr("x", d => xScale(d.jurisdiction) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.enforcement) + yScale.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", d => d.value > maxValue * 0.6 ? "#fff" : "#1f2937")
            .attr("opacity", 0)
            .text(d => d.value > 0 ? d.value.toFixed(2) : "—")
            .transition()
            .duration(600)
            .delay((d, i) => i * 30 + 300)
            .attr("opacity", 1);

        const legendWidth = 20;
        const legendHeight = height;
        const legendX = width + 30;

        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");

        const numStops = 10;
        for (let i = 0; i <= numStops; i++) {
            const offset = (i / numStops) * 100;
            const value = minValue + (maxValue - minValue) * (i / numStops);
            linearGradient.append("stop")
                .attr("offset", `${offset}%`)
                .attr("stop-color", colorScale(value));
        }

        g.append("rect")
            .attr("x", legendX)
            .attr("y", 0)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)")
            .attr("stroke", "#d1d5db")
            .attr("stroke-width", 1);

        const legendScale = d3.scaleLinear()
            .domain([maxValue, minValue])
            .range([0, legendHeight]);

        const legendAxis = d3.axisRight(legendScale)
            .ticks(5)
            .tickFormat(d => d.toFixed(2));

        g.append("g")
            .attr("class", "legend-axis")
            .attr("transform", `translate(${legendX + legendWidth}, 0)`)
            .call(legendAxis)
            .selectAll("text")
            .style("font-size", "11px");

        g.append("text")
            .attr("x", legendX + legendWidth / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "#374151")
            .text("Avg Prediction");

        g.append("text")
            .attr("x", width / 2)
            .attr("y", -35)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "700")
            .attr("fill", "#1f2937")
            .text("Enforcement Response Intensity by Jurisdiction");
    }
}
