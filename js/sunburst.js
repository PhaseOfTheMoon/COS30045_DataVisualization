// Enhanced sunburst.js with zoom, improved tooltips, and animations

const drawSunburst = (data) => {
  // Configuration
  const width = 400;
  const height = 400;
  const radius = Math.min(width, height) / 2 - 60;
  const labelAreaWidth = 120;
  const totalWidth = width + labelAreaWidth * 2;
  const totalHeight = height + 150;

  // Color schemes
  const jurisdictionColors = d3.scaleOrdinal()
    .domain(['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'])
    .range(['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']);

  const drugColors = {
    'AMPHETAMINE': '#fca5a5',
    'CANNABIS': '#86efac',
    'COCAINE': '#fde047',
    'ECSTASY': '#c084fc',
    'METHYLAMPHETAMINE': '#f9a8d4'
  };

  // Clear existing content
  const container = d3.select("#sunburst");
  container.selectAll('*').remove();

  // Calculate total for percentages
  const totalCount = d3.sum(data, d => d.count);

  // Create tooltip with enhanced styling
  const tooltip = container
    .append('div')
    .attr('class', 'sunburst-tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background-color', 'rgba(0, 0, 0, 0.95)')
    .style('color', 'white')
    .style('padding', '16px 20px')
    .style('border-radius', '12px')
    .style('font-size', '14px')
    .style('pointer-events', 'none')
    .style('z-index', '1000')
    .style('box-shadow', '0 10px 25px rgba(0,0,0,0.5)')
    .style('backdrop-filter', 'blur(10px)')
    .style('border', '1px solid rgba(255,255,255,0.1)');

  const svg = container
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append('g')
    .attr('transform', `translate(${labelAreaWidth + width / 2},${100 + height / 2})`);

  // Add glow filter for hover effect
  const defs = svg.append('defs');
  const filter = defs.append('filter')
    .attr('id', 'glow')
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%');

  filter.append('feGaussianBlur')
    .attr('stdDeviation', '4')
    .attr('result', 'coloredBlur');

  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'coloredBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  // Group data by jurisdiction
  const groupedData = d3.group(data, d => d.jurisdiction);

  // Create hierarchical structure
  const hierarchyData = {
    name: 'root',
    children: Array.from(groupedData, ([jurisdiction, drugs]) => ({
      name: jurisdiction,
      children: drugs.map(d => ({
        name: d.drugType,
        value: d.count,
        jurisdiction: jurisdiction,
        drugType: d.drugType,
        detectionMethod: d.detectionMethod
      }))
    }))
  };

  // Create hierarchy
  const root = d3.hierarchy(hierarchyData)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  // Create partition layout
  const partition = d3.partition()
    .size([2 * Math.PI, radius])
    .padding(0.002);

  partition(root);

  // Create arc generator
  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1);

  // Track focused node for zoom
  let focusedNode = root;

  // Zoom function - NEW FEATURE
  function zoom(p) {
    focusedNode = p;

    const transition = g.transition()
      .duration(750)
      .tween('scale', () => {
        const xd = d3.interpolate(root.x0, p.x0);
        const yd = d3.interpolate(root.y0, p.y0);
        const yr = d3.interpolate(root.y1, p.y1);
        return t => {
          root.x0 = xd(t);
          root.y0 = yd(t);
          root.y1 = yr(t);
        };
      });

    transition.selectAll('path')
      .attrTween('d', d => () => arc(d))
      .attr('opacity', d => {
        if (d.depth === 0) return 0;
        // If we're at root, show all segments
        if (p === root) return 0.85;
        // Otherwise, show focused segment and its children
        if (d.parent === p || d === p) return 0.85;
        return 0.3;
      });

    // Update center text
    centerText.select('.main-text')
      .transition()
      .duration(300)
      .attr('opacity', 0)
      .transition()
      .duration(300)
      .text(p === root ? 'Drug Testing' : p.data.name)
      .attr('opacity', 1);

    centerText.select('.sub-text')
      .transition()
      .duration(300)
      .attr('opacity', 0)
      .transition()
      .duration(300)
      .text(p === root ? 'by Jurisdiction' : `${p.value.toLocaleString()} tests`)
      .attr('opacity', 1);
  }

  // Draw arcs with enhanced interactions
  const paths = g.selectAll('path')
    .data(root.descendants().filter(d => d.depth > 0))
    .join('path')
    .attr('class', 'sunburst-arc')
    .attr('fill', d => {
      if (d.depth === 1) {
        return jurisdictionColors(d.data.name);
      } else {
        return drugColors[d.data.drugType] || '#e5e7eb';
      }
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .attr('opacity', 0)
    .style('cursor', 'pointer')
    .on('click', function(event, d) {
      event.stopPropagation();
      if (d.depth === 1) {
        // Click on jurisdiction (inner ring) - zoom to it
        zoom(d);
      } else if (d.depth === 2) {
        // Click on drug (outer ring) - zoom to its parent jurisdiction
        zoom(d.parent);
      }
    })
    .on('mouseover', function(event, d) {
      // Enhanced hover effect - brighten color and add glow
      const currentColor = d3.select(this).attr('fill');
      const brighterColor = d3.color(currentColor).brighter(0.3);
      
      d3.select(this)
        .transition()
        .duration(200)
        .attr('fill', brighterColor)
        .attr('opacity', 1)
        .attr('stroke-width', 2)
        .attr('stroke', '#000')
        .style('filter', 'url(#glow)');

      // Calculate percentages
      const percentage = ((d.value / totalCount) * 100).toFixed(1);
      const parentPercentage = d.parent ? ((d.value / d.parent.value) * 100).toFixed(1) : 100;

      // Enhanced tooltips with hierarchical path and comparisons
      if (d.depth === 1) {
        const drugTypes = d.children ? d.children.length : 0;
        tooltip
          .style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
              📍 ${d.data.name}
            </div>
            <div style="margin-bottom: 6px;">
              🔬 Total Tests: <strong>${d.value.toLocaleString()}</strong>
            </div>
            <div style="margin-bottom: 6px; color: #60a5fa;">
              📊 ${percentage}% of all tests
            </div>
            <div style="color: #86efac;">
              💊 ${drugTypes} drug type(s)
            </div>
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 12px; color: #9ca3af;">
              Click to zoom in
            </div>
          `);
      } else {
        // Build hierarchical path
        const path = [];
        let current = d;
        while (current.parent && current.parent.depth > 0) {
          path.unshift(current.data.name || current.data.jurisdiction);
          current = current.parent;
        }
        
        tooltip
          .style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
              💊 ${formatDrugName(d.data.drugType)}
            </div>
            <div style="margin-bottom: 8px; font-size: 12px; color: #9ca3af;">
              Path: ${path.join(' → ')}
            </div>
            <div style="margin-bottom: 6px;">
              📍 Jurisdiction: <strong>${d.data.jurisdiction}</strong>
            </div>
            <div style="margin-bottom: 6px;">
              🧬 Positive Tests: <strong>${d.data.value.toLocaleString()}</strong>
            </div>
            <div style="margin-bottom: 6px; color: #60a5fa;">
              📊 ${percentage}% of all tests
            </div>
            <div style="margin-bottom: 6px; color: #86efac;">
              📈 ${parentPercentage}% of ${d.data.jurisdiction} tests
            </div>
            <div style="color: #fde047;">
              ✓ ${d.data.detectionMethod}
            </div>
          `);
      }
    })
    .on('mousemove', function(event) {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function(event, d) {
      // Return to original color
      const originalColor = d.depth === 1 
        ? jurisdictionColors(d.data.name)
        : drugColors[d.data.drugType] || '#e5e7eb';
      
      d3.select(this)
        .transition()
        .duration(200)
        .attr('fill', originalColor)
        .attr('opacity', 0.85)
        .attr('stroke-width', 2)
        .attr('stroke', '#fff')
        .style('filter', 'none');

      tooltip.style('visibility', 'hidden');
    })
    .transition()
    .duration(1000)
    .delay((d, i) => i * 30)
    .attrTween('d', function(d) {
      const interpolate = d3.interpolate(
        { x0: d.x0, x1: d.x0, y0: d.y0, y1: d.y1 },
        { x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 }
      );
      return function(t) {
        return arc(interpolate(t));
      };
    })
    .attr('opacity', 0.85);

  // Reset zoom on background click
  svg.on('click', function() {
    if (focusedNode !== root) {
      zoom(root);
    }
  });

  // Add labels for larger segments (inside the chart)
  const largeSegmentLabels = g.selectAll('.large-segment-label')
    .data(root.descendants().filter(d => {
      if (d.depth === 0) return false;
      const arcLength = (d.x1 - d.x0) * d.y1;
      return arcLength > 40;
    }))
    .join('text')
    .attr('class', 'large-segment-label')
    .attr('transform', d => {
      const angle = (d.x0 + d.x1) / 2;
      const midAngle = angle * 180 / Math.PI - 90;
      const radius = (d.y0 + d.y1) / 2;
      const x = Math.sin(angle) * radius;
      const y = -Math.cos(angle) * radius;
      if (d.depth === 1) {
        return `translate(${x},${y})`;
      } else {
        return `translate(${x},${y}) rotate(${midAngle > 90 ? midAngle + 180 : midAngle})`;
      }
    })
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', d => d.depth === 1 ? '#fff' : '#1f2937')
    .attr('font-weight', 'bold')
    .attr('font-size', d => d.depth === 1 ? '8px' : '7px')
    .attr('opacity', 0)
    .attr('pointer-events', 'none')
    .text('')
    .each(function(d) {
      const result = d.depth === 1 ? d.data.name : formatDrugName(d.data.drugType);
      const lines = Array.isArray(result) ? result : [result];
      
      lines.forEach((line, i) => {
        d3.select(this)
          .append('tspan')
          .attr('x', 0)
          .attr('dy', i === 0 ? 0 : '1.2em')
          .text(line);
      });
    })
    .transition()
    .duration(800)
    .delay((d, i) => i * 30 + 600)
    .attr('opacity', 1);

  // Get ALL segments (both small and medium) that need line labels
  let allSmallMediumSegments = root.descendants().filter(d => {
    if (d.depth === 0) return false;
    const arcLength = (d.x1 - d.x0) * d.y1;
    return arcLength <= 80;
  });

  // Remove Cannabis segments from VIC and WA that already have internal labels
  allSmallMediumSegments = allSmallMediumSegments.filter(d => {
    if (d.data.drugType === 'CANNABIS') {
      if (d.data.jurisdiction === 'SA' || d.data.jurisdiction === 'WA') {
        return false;
      }
    }
    return true;
  });

  // Prepare label data with positions
  const labelData = allSmallMediumSegments.map(d => {
    const angle = (d.x0 + d.x1) / 2;
    const segmentRadius = d.y1;
    const labelExtensionDistance = 110;
    
    return {
      data: d,
      angle: angle,
      segmentX: Math.sin(angle) * segmentRadius,
      segmentY: -Math.cos(angle) * segmentRadius,
      labelBaseX: Math.sin(angle) * (segmentRadius + labelExtensionDistance),
      labelBaseY: -Math.cos(angle) * (segmentRadius + labelExtensionDistance),
      labelY: 0,
      customOffset: null
    };
  });

  // Apply custom positioning for specific segments
  labelData.forEach(label => {
    const isTopArea = label.angle < 0.8 || label.angle > 5.5;
    label.isTopArea = isTopArea;
    
    // Manual adjustments for ACT jurisdiction labels
    if (label.data.data.drugType === 'AMPHETAMINE' && label.data.data.jurisdiction === 'ACT') {
      label.labelBaseX = 30;
      label.labelBaseY = -230;
      label.hasCustomPosition = true;
    }
    if (label.data.data.drugType === 'COCAINE' && label.data.data.jurisdiction === 'ACT') {
      label.labelBaseX = 55;
      label.labelBaseY = -155;
      label.hasCustomPosition = true;
    }
    if (label.data.data.drugType === 'CANNABIS' && label.data.data.jurisdiction === 'ACT') {
      label.labelBaseX = 80;
      label.labelBaseY = -200;
      label.hasCustomPosition = true;
    }
    
    if (label.data.depth === 1 && label.data.data.name === 'ACT') {
      label.labelBaseX = 100;
      label.labelBaseY = label.labelBaseY + 60;
      label.hasCustomPosition = true;
    }
    
    // Fix Ecstasy positions
    if (label.data.data.drugType === 'ECSTASY' && label.angle > 6.0) {
      label.labelBaseX = label.labelBaseX - 65;
      label.labelBaseY = label.labelBaseY + 20;
      label.hasCustomPosition = true;
    }
    if (label.data.data.drugType === 'ECSTASY' && label.data.data.jurisdiction === 'NSW') {
      label.labelBaseX = label.labelBaseX - 25;
      label.labelBaseY = label.labelBaseY - 30;
      label.hasCustomPosition = true;
    }
    if (label.data.data.drugType === 'ECSTASY' && label.data.data.jurisdiction === 'SA') {
      label.labelBaseX = label.labelBaseX + 25;
      label.labelBaseY = label.labelBaseY + 20;
      label.hasCustomPosition = true;
    }
    if (label.data.data.drugType === 'ECSTASY' && label.data.data.jurisdiction === 'WA') {
      label.labelBaseX = label.labelBaseX + 30;
      label.labelBaseY = label.labelBaseY - 20;
      label.hasCustomPosition = true;
    }

    // Fix Cannabis NT
    if (label.data.data.drugType === 'CANNABIS' && label.data.data.jurisdiction === 'NT') {
      label.labelBaseX = label.labelBaseX - 30;
      label.labelBaseY = label.labelBaseY - 20;
      label.hasCustomPosition = true;
    }
    
    if (label.data.data.drugType === 'CANNABIS' && label.data.data.jurisdiction === 'VIC') {
      label.labelBaseX = label.labelBaseX - 30;
      label.labelBaseY = label.labelBaseY + 70;
      label.hasCustomPosition = true;
    }
    
    if (label.data.data.drugType === 'CANNABIS' && label.data.data.jurisdiction === 'SA') {
      label.labelBaseX = label.labelBaseX - 50;
      label.labelBaseY = label.labelBaseY + 30;
      label.hasCustomPosition = true;
    }
    
    if (label.data.data.drugType === 'CANNABIS' && label.angle > 5.0 && label.angle < 6.2) {
      label.customOffset = { x: -40, y: 60 };
    }
  });

  // Sort by angle
  labelData.sort((a, b) => a.angle - b.angle);

  // Function to prevent label overlaps
  const resolveOverlaps = (labels) => {
    if (labels.length === 0) return;

    const labelHeight = 26;
    const minSpacing = 10;
    const centerClearance = 80;

    labels.forEach(label => {
      if (!label.customOffset && !label.hasCustomPosition) {
        label.labelY = label.labelBaseY;
      }
    });

    const labelsToResolve = labels.filter(l => !l.customOffset && !l.hasCustomPosition);

    const resolveGroup = (group) => {
      if (group.length === 0) return;
      
      group.sort((a, b) => a.labelY - b.labelY);
      
      let changed = true;
      let iterations = 0;
      const maxIterations = 20;

      while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        for (let i = 0; i < group.length - 1; i++) {
          const label1 = group[i];
          const label2 = group[i + 1];
          
          const yGap = label2.labelY - label1.labelY;
          const xGap = Math.abs(label2.labelBaseX - label1.labelBaseX);
          
          if (yGap < labelHeight + minSpacing && xGap < 100) {
            const targetGap = labelHeight + minSpacing;
            const currentMidpoint = (label1.labelY + label2.labelY) / 2;
            
            label1.labelY = currentMidpoint - targetGap / 2;
            label2.labelY = currentMidpoint + targetGap / 2;
            changed = true;
          }
        }
      }
    };

    resolveGroup(labelsToResolve);

    const maxY = height / 2 + 20;
    const minY = -(height / 2) - 20;

    labels.forEach(label => {
      if (label.customOffset || label.hasCustomPosition) return;
      
      if (Math.abs(label.labelY) < centerClearance) {
        if (label.labelY >= 0) {
          label.labelY = centerClearance;
        } else {
          label.labelY = -centerClearance;
        }
      }

      if (label.labelY > maxY) label.labelY = maxY;
      if (label.labelY < minY) label.labelY = minY;
    });
  };

  resolveOverlaps(labelData);

  // Track active label
  let activeLabel = null;

  // Create label groups with enhanced interactivity
  const labelGroups = g.selectAll('.segment-label-group')
    .data(labelData)
    .join('g')
    .attr('class', 'segment-label-group')
    .attr('opacity', 0)
    .style('cursor', 'pointer');

  // Add leader lines
  labelGroups.append('line')
    .attr('class', 'leader-line')
    .attr('x1', d => d.segmentX)
    .attr('y1', d => d.segmentY)
    .attr('x2', d => {
      if (d.hasCustomPosition) return d.labelBaseX;
      if (d.customOffset) return d.segmentX + d.customOffset.x;
      return d.labelBaseX;
    })
    .attr('y2', d => {
      if (d.hasCustomPosition) return d.labelBaseY;
      if (d.customOffset) return d.segmentY + d.customOffset.y;
      return d.labelY;
    })
    .attr('stroke', '#9ca3af')
    .attr('stroke-width', 1)
    .attr('opacity', 0.6);

  // Add label text
  labelGroups.append('text')
    .attr('class', 'segment-label')
    .attr('x', d => {
      if (d.hasCustomPosition) return d.labelBaseX;
      if (d.customOffset) return d.segmentX + d.customOffset.x;
      return d.labelBaseX;
    })
    .attr('y', d => {
      if (d.hasCustomPosition) return d.labelBaseY;
      if (d.customOffset) return d.segmentY + d.customOffset.y;
      return d.labelY;
    })
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#6b7280')
    .attr('font-size', '11px')
    .attr('font-weight', '500')
    .text(d => {
      if (d.data.depth === 1) {
        return d.data.data.name;
      } else {
        const formatted = formatDrugName(d.data.data.drugType);
        return Array.isArray(formatted) ? formatted.join(' ') : formatted;
      }
    });

  // Enhanced label interactions with zoom support
  labelGroups
    .on('click', function(event, d) {
      event.stopPropagation();

      // Zoom to parent jurisdiction when clicking line labels
      if (d.data.depth === 2) {
        // Outer ring drug - zoom to parent jurisdiction
        zoom(d.data.parent);
      } else if (d.data.depth === 1) {
        // Inner ring jurisdiction - zoom to it
        zoom(d.data);
      }

      // Deactivate previous active label
      if (activeLabel && activeLabel !== this) {
        d3.select(activeLabel)
          .transition()
          .duration(200)
          .attr('opacity', 0.6);

        d3.select(activeLabel).select('.leader-line')
          .transition()
          .duration(200)
          .attr('stroke', '#9ca3af')
          .attr('stroke-width', 1)
          .attr('opacity', 0.6);

        d3.select(activeLabel).select('.segment-label')
          .transition()
          .duration(200)
          .attr('fill', '#6b7280')
          .attr('font-weight', '500')
          .style('filter', 'none');
      }

      if (activeLabel === this) {
        activeLabel = null;
        tooltip.style('visibility', 'hidden');
      } else {
        activeLabel = this;

        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1);

        d3.select(this).select('.leader-line')
          .transition()
          .duration(200)
          .attr('stroke', '#000')
          .attr('stroke-width', 2)
          .attr('opacity', 1);

        d3.select(this).select('.segment-label')
          .transition()
          .duration(200)
          .attr('fill', '#000')
          .attr('font-weight', '700')
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');

        // Show enhanced tooltip with percentages
        const drugData = d.data.data;
        
        // Only show tooltip if it's a drug type (not jurisdiction)
        if (drugData.drugType) {
          const percentage = ((drugData.value / totalCount) * 100).toFixed(1);
          const parentPercentage = d.data.parent ? ((drugData.value / d.data.parent.value) * 100).toFixed(1) : 100;
          
          tooltip
            .style('visibility', 'visible')
            .html(`
              <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
                💊 ${formatDrugName(drugData.drugType)}
              </div>
              <div style="margin-bottom: 6px;">
                📍 Jurisdiction: <strong>${drugData.jurisdiction}</strong>
              </div>
              <div style="margin-bottom: 6px;">
                🧬 Positive Tests: <strong>${drugData.value.toLocaleString()}</strong>
              </div>
              <div style="margin-bottom: 6px; color: #60a5fa;">
                📊 ${percentage}% of all tests
              </div>
              <div style="margin-bottom: 6px; color: #86efac;">
                📈 ${parentPercentage}% of ${drugData.jurisdiction} tests
              </div>
              <div style="color: #fde047;">
                ✓ ${drugData.detectionMethod}
              </div>
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 12px; color: #9ca3af;">
                Click to zoom in
              </div>
            `);
        } else {
          // Jurisdiction label
          tooltip
            .style('visibility', 'visible')
            .html(`
              <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
                📍 ${d.data.data.name}
              </div>
              <div style="margin-bottom: 6px;">
                🔬 Total Tests: <strong>${d.data.value.toLocaleString()}</strong>
              </div>
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 12px; color: #9ca3af;">
                Click to zoom in
              </div>
            `);
        }
      }
    })
    .on('mouseover', function(event, d) {
      if (activeLabel !== this) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.9);

        d3.select(this).select('.leader-line')
          .transition()
          .duration(200)
          .attr('stroke', '#4b5563')
          .attr('opacity', 0.8);

        d3.select(this).select('.segment-label')
          .transition()
          .duration(200)
          .attr('fill', '#1f2937');
      }
    })
    .on('mouseout', function(event, d) {
      if (activeLabel !== this) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.6);

        d3.select(this).select('.leader-line')
          .transition()
          .duration(200)
          .attr('stroke', '#9ca3af')
          .attr('opacity', 0.6);

        d3.select(this).select('.segment-label')
          .transition()
          .duration(200)
          .attr('fill', '#6b7280');
      }
    })
    .on('mousemove', function(event) {
      if (activeLabel === this) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      }
    });

  // Animate labels in
  labelGroups
    .transition()
    .duration(800)
    .delay((d, i) => i * 20 + 800)
    .attr('opacity', 0.6);

  // Close tooltip when clicking elsewhere
  svg.on('click', function(event) {
    if (activeLabel) {
      d3.select(activeLabel)
        .transition()
        .duration(200)
        .attr('opacity', 0.6);

      d3.select(activeLabel).select('.leader-line')
        .transition()
        .duration(200)
        .attr('stroke', '#9ca3af')
        .attr('stroke-width', 1)
        .attr('opacity', 0.6);

      d3.select(activeLabel).select('.segment-label')
        .transition()
        .duration(200)
        .attr('fill', '#6b7280')
        .attr('font-weight', '500')
        .style('filter', 'none');

      activeLabel = null;
      tooltip.style('visibility', 'hidden');
    }

    // Reset zoom if not at root
    if (focusedNode !== root) {
      zoom(root);
    }
  });

  // Center circle with enhanced styling
  g.append('circle')
    .attr('r', 0)
    .attr('fill', '#ffffff')
    .attr('stroke', '#d1d5db')
    .attr('stroke-width', 2)
    .style('filter', 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))')
    .transition()
    .duration(1000)
    .attr('r', root.children[0].y0 - 10);

  // Center text with dynamic updates
  const centerText = g.append('g').attr('class', 'center-text');

  centerText.append('text')
    .attr('class', 'main-text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.5em')
    .attr('font-size', '10px')
    .attr('font-weight', 'bold')
    .attr('fill', '#374151')
    .attr('opacity', 0)
    .text('Drug Testing')
    .transition()
    .duration(1000)
    .delay(800)
    .attr('opacity', 1);

  centerText.append('text')
    .attr('class', 'sub-text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1em')
    .attr('font-size', '8px')
    .attr('fill', '#6b7280')
    .attr('opacity', 0)
    .text('by Jurisdiction')
    .transition()
    .duration(1000)
    .delay(800)
    .attr('opacity', 1);

  // Add animated legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(20, 20)');

  legend.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('font-size', '11px')
    .attr('font-weight', 'bold')
    .attr('fill', '#1f2937')
    .attr('opacity', 0)
    .text('Drug Types')
    .transition()
    .duration(800)
    .delay(1200)
    .attr('opacity', 1);

  const drugLegend = Object.entries(drugColors).map(([drug, color], i) => ({
    drug: formatDrugName(drug),
    color,
    y: 20 + i * 22
  }));

  const legendItems = legend.selectAll('.legend-item')
    .data(drugLegend)
    .join('g')
    .attr('class', 'legend-item')
    .attr('transform', d => `translate(0, ${d.y})`)
    .attr('opacity', 0);

  legendItems.append('rect')
    .attr('width', 14)
    .attr('height', 14)
    .attr('rx', 2)
    .attr('fill', d => d.color)
    .attr('stroke', '#d1d5db')
    .attr('stroke-width', 1);

  legendItems.append('text')
    .attr('x', 20)
    .attr('y', 11)
    .attr('font-size', '10px')
    .attr('fill', '#4b5563')
    .text(d => d.drug);

  // Animate legend items in sequence
  legendItems
    .transition()
    .duration(600)
    .delay((d, i) => 1400 + i * 100)
    .attr('opacity', 1);
};

/**
 * Format drug name for display
 */
function formatDrugName(drugName) {
  if (!drugName) return '';
  
  const formatted = drugName.charAt(0) + drugName.slice(1).toLowerCase();
  
  if (formatted.toLowerCase() === 'methylamphetamine') {
    return ['Methyl', 'amphetamine'];
  }
  
  return formatted;
}