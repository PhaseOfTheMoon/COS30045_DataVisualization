// sunburst.js - Sunburst diagram for jurisdiction and drug type data
const drawSunburst = (data) => {
  // Configuration
  const width = 400;
  const height = 400;
  const radius = Math.min(width, height) / 2 - 60;
  const labelAreaWidth = 120; // Increased for better label spacing

  // Adjust viewBox to accommodate labels (increased height for more vertical space)
  const totalWidth = width + labelAreaWidth * 2;
  const totalHeight = height + 200;

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

  // Create tooltip
  const tooltip = container
    .append('div')
    .attr('class', 'sunburst-tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background-color', 'rgba(0, 0, 0, 0.9)')
    .style('color', 'white')
    .style('padding', '12px 16px')
    .style('border-radius', '8px')
    .style('font-size', '13px')
    .style('pointer-events', 'none')
    .style('z-index', '1000')
    .style('box-shadow', '0 4px 6px rgba(0,0,0,0.3)');

  const svg = container
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Translate center rightwards by labelAreaWidth so left label area fits
  const g = svg.append('g')
    .attr('transform', `translate(${labelAreaWidth + width / 2},${100 + height / 2})`);

  // Group data by jurisdiction
  const groupedData = d3.group(data, d => d.jurisdiction);

  // Create hierarchical structure for sunburst
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

  // Draw arcs (paths)
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
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1)
        .attr('stroke-width', 2)
        .attr('stroke', '#000');

      if (d.depth === 1) {
        const total = d.value;
        tooltip
          .style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 6px;">
              ${d.data.name}
            </div>
            <div style="margin-bottom: 4px;">
              📊 Total Tests: <strong>${total.toLocaleString()}</strong>
            </div>
            <div style="color: #60a5fa;">
              ${d.children ? d.children.length : 0} drug type(s)
            </div>
          `);
      } else {
        tooltip
          .style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 6px;">
              ${formatDrugName(d.data.drugType)}
            </div>
            <div style="margin-bottom: 4px;">
              📍 Jurisdiction: <strong>${d.data.jurisdiction}</strong>
            </div>
            <div style="margin-bottom: 4px;">
              🧬 Positive Tests: <strong>${d.data.value.toLocaleString()}</strong>
            </div>
            <div style="color: #60a5fa;">
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
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.85)
        .attr('stroke-width', 2)
        .attr('stroke', '#fff');

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
      return arcLength <= 80; // Show line labels for segments smaller than this threshold
    });

    // Remove Cannabis segments that are large enough to have internal labels
    // Filter out Cannabis labels from VIC and WA (the large ones)
    allSmallMediumSegments = allSmallMediumSegments.filter(d => {
      if (d.data.drugType === 'CANNABIS') {
        // Remove Cannabis from VIC and WA (these have large segments with internal labels)
        if (d.data.jurisdiction === 'SA' || d.data.jurisdiction === 'WA') {
          return false;
        }
      }
      return true;
    });

  const labelData = allSmallMediumSegments.map(d => {
    const angle = (d.x0 + d.x1) / 2;
    const segmentRadius = d.y1; // Outer edge of segment
    const labelExtensionDistance = 110; // Distance to extend labels away from chart (increased further)
    
    return {
      data: d,
      angle: angle,
      segmentX: Math.sin(angle) * segmentRadius,
      segmentY: -Math.cos(angle) * segmentRadius,
      labelBaseX: Math.sin(angle) * (segmentRadius + labelExtensionDistance),
      labelBaseY: -Math.cos(angle) * (segmentRadius + labelExtensionDistance),
      labelY: 0, // Will be adjusted
      customOffset: null // Can be set for specific labels
    };
  });

 // Apply custom positioning for specific segments
  labelData.forEach(label => {
    // Only mark the very top labels (around angle 0) as needing adjustment
    const isTopArea = label.angle < 0.8 || label.angle > 5.5;
    label.isTopArea = isTopArea;
    
    // Manual adjustment for the three overlapping labels at the top (ACT jurisdiction)
    if (label.data.data.drugType === 'AMPHETAMINE' && label.data.data.jurisdiction === 'ACT') {
      label.labelBaseX = 30;
      label.labelBaseY = -230;
      label.hasCustomPosition = true;
      console.log('Found Amphetamine ACT at angle:', label.angle);
    }
    if (label.data.data.drugType === 'COCAINE' && label.data.data.jurisdiction === 'ACT') {
      label.labelBaseX = 55;
      label.labelBaseY = -155;
      label.hasCustomPosition = true;
      console.log('Found Cocaine ACT at angle:', label.angle);
    }
    if (label.data.data.drugType === 'CANNABIS' && label.data.data.jurisdiction === 'ACT') {
      label.labelBaseX = 80;
      label.labelBaseY = -200;
      label.hasCustomPosition = true;
      console.log('Found Cannabis ACT at angle:', label.angle);
    }
    
    // Move ACT label closer to the chart
    if (label.data.depth === 1 && label.data.data.name === 'ACT') {
      label.labelBaseX = 100; // Much closer (was 120)
      label.labelBaseY = label.labelBaseY + 60; // Adjust lower
      label.hasCustomPosition = true;
    }
    
    // Fix Ecstasy
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
    
    // Move Cannabis labels that are inside segments (VIC, SA) outside
    if (label.data.data.drugType === 'CANNABIS' && label.data.data.jurisdiction === 'VIC') {
      label.labelBaseX = label.labelBaseX - 30; // Move more left
      label.labelBaseY = label.labelBaseY + 70; // Move down
      label.hasCustomPosition = true;
    }
    
    if (label.data.data.drugType === 'CANNABIS' && label.data.data.jurisdiction === 'SA') {
      label.labelBaseX = label.labelBaseX - 50; // Move more left  
      label.labelBaseY = label.labelBaseY + 30; // Move down slightly
      label.hasCustomPosition = true;
    }
    
    // Cannabis segment in bottom-left area
    if (label.data.data.drugType === 'CANNABIS' && label.angle > 5.0 && label.angle < 6.2) {
      label.customOffset = { x: -40, y: 60 };
    }
  });

  // ADD THIS DEBUG CODE HERE:
  console.log('=== DEBUG: Checking all labels ===');
  labelData.forEach(label => {
    if (label.hasCustomPosition) {
      console.log('Custom positioned label:', {
        drug: label.data.data.drugType,
        angle: label.angle,
        labelBaseX: label.labelBaseX,
        labelBaseY: label.labelBaseY,
        hasCustomPosition: label.hasCustomPosition
      });
    }
  });
  // Sort by angle to determine vertical stacking
  labelData.sort((a, b) => a.angle - b.angle);

  // Function to prevent label overlaps by adjusting Y positions
  const resolveOverlaps = (labels) => {
    if (labels.length === 0) return;

    const labelHeight = 26;
    const minSpacing = 10;
    const centerClearance = 80;

    // First pass: assign initial Y positions
    labels.forEach(label => {
      // Skip labels with custom offsets - they're already positioned
      if (!label.customOffset && !label.hasCustomPosition) {
        label.labelY = label.labelBaseY;
      }
    });

    // Only resolve overlaps for labels without custom positioning
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

    // Ensure labels stay within bounds (only for non-custom labels)
    const maxY = height / 2 + 20;
    const minY = -(height / 2) - 20;

    labels.forEach(label => {
      if (label.customOffset || label.hasCustomPosition) return; // Skip custom positioned labels
      
      // Keep labels away from center
      if (Math.abs(label.labelY) < centerClearance) {
        if (label.labelY >= 0) {
          label.labelY = centerClearance;
        } else {
          label.labelY = -centerClearance;
        }
      }

      // Clamp Y position
      if (label.labelY > maxY) {
        label.labelY = maxY;
      }
      if (label.labelY < minY) {
        label.labelY = minY;
      }
    });
  };

  resolveOverlaps(labelData);

  const finalLabels = labelData;

  // Track active label
  let activeLabel = null;

  // Create label groups with interactivity
  const labelGroups = g.selectAll('.segment-label-group')
    .data(finalLabels)
    .join('g')
    .attr('class', 'segment-label-group')
    .attr('opacity', 0.6)
    .style('cursor', 'pointer');

  // Add leader lines from segment to label
  labelGroups.append('line')
    .attr('class', 'leader-line')
    .attr('x1', d => d.segmentX)
    .attr('y1', d => d.segmentY)
    .attr('x2', d => {
      if (d.hasCustomPosition) {
        return d.labelBaseX;
      }
      if (d.customOffset) {
        return d.segmentX + d.customOffset.x;
      }
      return d.labelBaseX;
    })
    .attr('y2', d => {
      if (d.hasCustomPosition) {
        return d.labelBaseY;
      }
      if (d.customOffset) {
        return d.segmentY + d.customOffset.y;
      }
      return d.labelY;
    })
    .attr('stroke', '#9ca3af')
    .attr('stroke-width', 1)
    .attr('opacity', 0.6);

  // Add labels with text only
  labelGroups.append('text')
    .attr('class', 'segment-label')
    .attr('x', d => {
      if (d.hasCustomPosition) {
        return d.labelBaseX;
      }
      if (d.customOffset) {
        return d.segmentX + d.customOffset.x;
      }
      return d.labelBaseX;
    })
    .attr('y', d => {
      if (d.hasCustomPosition) {
        return d.labelBaseY;
      }
      if (d.customOffset) {
        return d.segmentY + d.customOffset.y;
      }
      return d.labelY;
    })
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#6b7280')
    .attr('font-size', '11px')
    .attr('font-weight', '500')
    .attr('opacity', 0.7)
    .text(d => {
      if (d.data.depth === 1) {
        return d.data.data.name;
      } else {
        return formatDrugName(d.data.data.drugType);
      }
    });
    
  // Add click interactions for label groups
  labelGroups
    .on('click', function(event, d) {
      event.stopPropagation();

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
          .attr('opacity', 0.7)
          .attr('fill', '#6b7280');
      }

      // Activate clicked label
      if (activeLabel === this) {
        // Toggle off
        activeLabel = null;
        tooltip.style('visibility', 'hidden');
      } else {
        // Toggle on
        activeLabel = this;

        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1);

        d3.select(this).select('.leader-line')
          .transition()
          .duration(200)
          .attr('stroke', '#000')
          .attr('stroke-width', 1.5)
          .attr('opacity', 1);

        d3.select(this).select('.segment-label')
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('fill', '#000')
          .attr('font-weight', '700');

        // Show tooltip
        const drugData = d.data.data;
        tooltip
          .style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 6px;">
              ${formatDrugName(drugData.drugType)}
            </div>
            <div style="margin-bottom: 4px;">
              📍 Jurisdiction: <strong>${drugData.jurisdiction}</strong>
            </div>
            <div style="margin-bottom: 4px;">
              🧬 Positive Tests: <strong>${drugData.value.toLocaleString()}</strong>
            </div>
            <div style="color: #60a5fa;">
              ✓ ${drugData.detectionMethod}
            </div>
          `);
      }
    })
    .on('mousemove', function(event) {
      if (activeLabel === this) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      }
    });

  // Close tooltip when clicking elsewhere
  svg.on('click', function() {
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
        .attr('opacity', 0.7)
        .attr('fill', '#6b7280');

      activeLabel = null;
      tooltip.style('visibility', 'hidden');
    }
  });

  // Animate labels in
  labelGroups
    .transition()
    .duration(800)
    .delay((d, i) => i * 20 + 600)
    .attr('opacity', 0.8);

  // Add center circle with title
  g.append('circle')
    .attr('r', 0)
    .attr('fill', '#f9fafb')
    .attr('stroke', '#d1d5db')
    .attr('stroke-width', 2)
    .transition()
    .duration(1000)
    .attr('r', root.children[0].y0 - 10);

  g.append('text')
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

  g.append('text')
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

};

/**
 * Format drug name for display
 */
function formatDrugName(drugName) {
  if (!drugName) return '';
  
  const formatted = drugName.charAt(0) + drugName.slice(1).toLowerCase();
  
  // Split long names into multiple lines
  if (formatted.toLowerCase() === 'methylamphetamine') {
    return ['Methyl', 'amphetamine'];
  }
  
  return formatted;
}