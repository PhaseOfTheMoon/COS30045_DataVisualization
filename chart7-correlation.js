// ===================================
// CHART 7: ENFORCEMENT RESPONSE CORRELATION
// Scatter plots showing correlation between positive drug tests and enforcement actions
// Research Question 7: How do fines, arrests, and charges correlate with number of positive tests?
// ===================================

(function() {
    // ===================================
    // CHART CONFIGURATION
    // ===================================

    // Margin convention for D3.js charts
    const margin = { top: 40, right: 30, bottom: 60, left: 80 };
    const container = d3.select("#chart-7-correlation");

    // Create responsive SVG with viewBox
    const svg = container.append("svg")
        .attr("viewBox", `0 0 1100 500`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Calculate inner dimensions
    const width = 1100 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create main chart group with margins applied
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // ===================================
    // TOOLTIP SETUP
    // ===================================

    // Create tooltip div for interactive data display
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

    // ===================================
    // VIEW CONTROL BUTTONS
    // ===================================

    // Create button container for switching between enforcement types
    const buttonContainer = container.insert("div", "svg")
        .style("text-align", "center")
        .style("margin-bottom", "15px");

    // Button data: each represents one enforcement type
    const viewOptions = [
        { id: "fines", label: "Fines vs Positive Tests", color: "#f59e0b" },
        { id: "arrests", label: "Arrests vs Positive Tests", color: "#ef4444" },
        { id: "charges", label: "Charges vs Positive Tests", color: "#8b5cf6" }
    ];

    // Current view state (default: fines)
    let currentView = "fines";

    // Create toggle buttons for each view
    const buttons = buttonContainer.selectAll("button")
        .data(viewOptions)
        .join("button")
        .text(d => d.label)
        .style("padding", "8px 16px")
        .style("margin", "0 5px")
        .style("border", "2px solid #e5e7eb")
        .style("border-radius", "6px")
        .style("background", d => d.id === currentView ? d.color : "#fff")
        .style("color", d => d.id === currentView ? "#fff" : "#374151")
        .style("font-weight", "600")
        .style("cursor", "pointer")
        .style("transition", "all 0.3s ease")
        .on("click", function(event, d) {
            // Update current view
            currentView = d.id;

            // Update button styles
            buttons
                .style("background", btn => btn.id === currentView ? btn.color : "#fff")
                .style("color", btn => btn.id === currentView ? "#fff" : "#374151");

            // Redraw chart with new view
            updateChart(processedData, currentView);
        });

    // ===================================
    // COLOR SCALE FOR JURISDICTIONS
    // ===================================

    // Consistent color mapping for all Australian jurisdictions
    const jurisdictionColors = {
        'NSW': '#2563eb',
        'VIC': '#0891b2',
        'QLD': '#f59e0b',
        'SA': '#ef4444',
        'WA': '#8b5cf6',
        'TAS': '#10b981',
        'NT': '#f97316',
        'ACT': '#6366f1'
    };

    // D3 color scale
    const colorScale = d3.scaleOrdinal()
        .domain(Object.keys(jurisdictionColors))
        .range(Object.values(jurisdictionColors));

    // ===================================
    // DATA LOADING AND PROCESSING
    // ===================================

    let processedData = []; // Store processed data globally for view switching

    // Load pre-processed CSV file (already aggregated by teammate)
    d3.csv("./data/FinArrChrByPositiveTest.csv", d3.autoType).then(data => {
        console.log('Chart 7: Data loaded', data.length, 'records');
        console.log('Chart 7: Sample data:', data[0]);

        // Data is already processed, just rename columns for easier use
        processedData = data.map(d => ({
            jurisdiction: d.JURISDICTION,
            count: d["Count(BEST_DETECTION_METHOD)"],
            fines: d["Sum(FINES)"],
            arrests: d["Sum(ARRESTS)"],
            charges: d["Sum(CHARGES)"]
        }));

        // Filter out invalid data points (zero values)
        processedData = processedData.filter(d =>
            d.count > 0 &&
            (d.fines > 0 || d.arrests > 0 || d.charges > 0)
        );

        console.log('Chart 7: Valid data points:', processedData.length);

        // Draw initial chart (default view: fines)
        updateChart(processedData, currentView);

    }).catch(error => {
        console.error('Chart 7: Error loading data:', error);
        container.append("p")
            .style("color", "red")
            .style("text-align", "center")
            .style("padding", "20px")
            .text("Error loading data. Please check the console.");
    });

    // ===================================
    // CHART UPDATE FUNCTION
    // ===================================

    /**
     * Updates the scatter plot based on selected view
     * @param {Array} data - Processed data array
     * @param {String} view - Current view ('fines', 'arrests', or 'charges')
     */
    function updateChart(data, view) {
        // Clear previous chart elements
        g.selectAll("*").remove();

        // Determine Y-axis field based on current view
        const yField = view; // 'fines', 'arrests', or 'charges'
        const yLabel = view.charAt(0).toUpperCase() + view.slice(1); // Capitalize

        // ===================================
        // SCALES
        // ===================================

        // X-axis: Count of best detection method (linear scale)
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .range([0, width])
            .nice(); // Round to nice values

        // Y-axis: Enforcement action count (linear scale)
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[yField])])
            .range([height, 0])
            .nice();

        // ===================================
        // AXES
        // ===================================

        // X-axis
        const xAxis = d3.axisBottom(xScale)
            .ticks(8)
            .tickFormat(d => d3.format(",.0f")(d)); // Format with thousands separator

        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "12px");

        // X-axis label
        g.append("text")
            .attr("x", width / 2)
            .attr("y", height + 45)
            .attr("text-anchor", "middle")
            .attr("fill", "#374151")
            .attr("font-size", "14px")
            .attr("font-weight", "600")
            .text("Count (Best Detection Method)");

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
            .text(`Number of ${yLabel}`);

        // ===================================
        // GRID LINES (for easier reading)
        // ===================================

        g.append("g")
            .attr("class", "grid")
            .attr("opacity", 0.1)
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat(""));

        g.append("g")
            .attr("class", "grid")
            .attr("opacity", 0.1)
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .tickSize(-height)
                .tickFormat(""));

        // ===================================
        // SCATTER PLOT CIRCLES
        // ===================================

        // Draw circles for each data point
        g.selectAll(".dot")
            .data(data)
            .join("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.count))
            .attr("cy", d => yScale(d[yField]))
            .attr("r", 0) // Start with radius 0 for animation
            .attr("fill", d => colorScale(d.jurisdiction))
            .attr("opacity", 0.7)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer")
            // Tooltip on hover
            .on("mouseover", function(event, d) {
                // Highlight circle
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 8)
                    .attr("opacity", 1)
                    .attr("stroke-width", 2);

                // Show tooltip
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);

                tooltip.html(`
                    <strong>${d.jurisdiction}</strong><br/>
                    Count: <strong>${d3.format(",")(d.count)}</strong><br/>
                    ${yLabel}: <strong>${d3.format(",")(d[yField])}</strong>
                `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                // Reset circle
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 5)
                    .attr("opacity", 0.7)
                    .attr("stroke-width", 1.5);

                // Hide tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            // Animate entrance
            .transition()
            .duration(800)
            .delay((d, i) => i * 2) // Stagger animation
            .attr("r", 5);

        // ===================================
        // LEGEND
        // ===================================

        const legend = g.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 100}, 20)`);

        // Create legend items for each jurisdiction
        const jurisdictions = Array.from(new Set(data.map(d => d.jurisdiction))).sort();

        const legendItems = legend.selectAll(".legend-item")
            .data(jurisdictions)
            .join("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        // Legend colored circles
        legendItems.append("circle")
            .attr("r", 5)
            .attr("fill", d => colorScale(d))
            .attr("opacity", 0.7);

        // Legend text labels
        legendItems.append("text")
            .attr("x", 12)
            .attr("y", 4)
            .attr("font-size", "11px")
            .attr("fill", "#374151")
            .text(d => d);
    }

})();
