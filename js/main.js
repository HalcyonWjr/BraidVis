// "ATTENDESS" DATA
const dataPath = "/data/output_attendees.json"


// COLOR SCHEMES
const colorPalette = ["#E91E63", "#272AB0", "#9B8BFB", "#C2185B", "#276BB0", "#E26F2A", "#9C27B0", "#57ACDC", "#E69621", "#5727B0", "#57DCBE", "#509181"]
const strokeHighlight = "#E4F0E9"
const defaultGrey = "#a7a6ba";
const secotorPalette = ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]

// TOP MARGIN FOR TITLES
const paddingTopForTitles = 50;

// TRANSFORM "ATTENDEES" FOR NETWORK
function transformToNetwork(data, areaAttr) {
    const nodes = {};
    const links = {};

    // create nodes and links, and calculate degress
    data.attendees.forEach(attendee => {
        attendee[areaAttr].forEach((area, index) => {
            // first item in the area list
            // Nodes
            nodes[area] = (nodes[area] || 0) + 1;

            // Self-referencing link for single area attendee
            if(attendee[areaAttr].length === 1) {
                const linkKeySelf = `${area}-${area}`;
                links[linkKeySelf] = (links[linkKeySelf] || 0) + 1;
            }

            // rest of the areas list
            for (let j = index + 1; j < attendee[areaAttr].length; j++) {
                const area2 = attendee[areaAttr][j];
                // link without directions
                const linkKey = area < area2 ? `${area}-${area2}` : `${area2}-${area}`;
                // Links
                links[linkKey] = (links[linkKey] || 0) + 1;
            }
        });
    });

    const nodesArray = Object.entries(nodes).map(([id, degree]) => ({ id, degree }));
    nodesArray.sort((a, b) => b.degree - a.degree);

    const initialLinksArray = Object.entries(links).map(([key, value]) => {
        const [source, target] = key.split('-');
        return { source, target, value };
    });

    const topNodesSet = new Set(nodesArray.slice(0, 12).map(node => node.id));
    const bothTopNodes = initialLinksArray.filter(link => topNodesSet.has(link.source) && topNodesSet.has(link.target));
    const oneTopNode = initialLinksArray.filter(link => topNodesSet.has(link.source) || topNodesSet.has(link.target));
    const noTopNodes = initialLinksArray.filter(link => !topNodesSet.has(link.source) && !topNodesSet.has(link.target));

    const sortedLinksArray = [...bothTopNodes, ...oneTopNode, ...noTopNodes];

    const counts = {
        bothTopNodes: bothTopNodes.length,
        oneTopNode: oneTopNode.length,
        noTopNodes: noTopNodes.length
    };

    console.log("link group", counts);
    
    return { nodes: nodesArray, links: sortedLinksArray };
}

function transformToBeeswarm(data, areaAttr) {
    const nodes = {};
    const links = {};

    // create nodes and links, and calculate degress
    data.attendees.forEach(attendee => {
        attendee[areaAttr].forEach((area, index) => {
            // first item in the area list
            // Nodes
            nodes[area] = (nodes[area] || 0) + 1;

            // Self-referencing link for single area attendee
            if(attendee[areaAttr].length === 1) {
                const linkKeySelf = `${area}-${area}`;
                links[linkKeySelf] = (links[linkKeySelf] || 0) + 1;
            }

            // rest of the areas list
            for (let j = index + 1; j < attendee[areaAttr].length; j++) {
                const area2 = attendee[areaAttr][j];
                // link without directions
                const linkKey = area < area2 ? `${area}-${area2}` : `${area2}-${area}`;
                // Links
                links[linkKey] = (links[linkKey] || 0) + 1;
            }
        });
    });

    // Construct node-link data structure for d3
    const nodesArray = Object.entries(nodes).map(([id, degree], index) => ({ id, degree, index }));
    const linksArray = Object.entries(links).map(([key, value]) => {
        const [source, target] = key.split('-');
        return { source, target, value };
    });

    return { nodes: nodesArray, links: linksArray };
}

function transformToMatrix(data) {
    const nodeIds = data.nodes.map(node => node.id);

    // initialize N*N matrix
    const matrix = nodeIds.map(() => Array(nodeIds.length).fill(0));

    // fill in data

    data.links.forEach(link => {
        const sourceIndex = nodeIds.indexOf(link.source);
        const targetIndex = nodeIds.indexOf(link.target);
        
        matrix[sourceIndex][targetIndex] = link.value;

        // for not self-referencing ones
        if(sourceIndex !== targetIndex) {
            matrix[targetIndex][sourceIndex] = link.value;
        }
    });

    return matrix;
}

function transformToGroup(data, areaAttr, groupAttr) {
    // Calculate unique areas_cleaned and sectors_cleaned
    const areas_cleaned = [...new Set(data.attendees.flatMap(attendee => attendee[areaAttr]))];
    const sectors_cleaned = [...new Set(data.attendees.flatMap(attendee => attendee[groupAttr]))];
  
    const result = [];
    const typeIndexWithinGroup = {};

    sectors_cleaned.forEach((sector, groupIndex) => {

      areas_cleaned.forEach(area => {
        const count = data.attendees.filter(attendee => 
          attendee[areaAttr].includes(area) && attendee.sectors_cleaned.includes(sector)
        ).length;
  
        if (count > 0) {
          // Get the current index for this type within its group
          const currentIndex = typeIndexWithinGroup[sector] || 0;

          result.push({
            type: area,
            count: count,
            group: groupIndex,
            group_name: sector,
            type_index_within_group: currentIndex
          });

          // Increment the index for this type within its group
          typeIndexWithinGroup[sector] = currentIndex + 1;
        }
      });
    });
  
    // Sort by group and then by count
    result.sort((a, b) => a.group - b.group || b.count - a.count);
  
    return {area: areas_cleaned, group: sectors_cleaned, data: result};
}

function transformToSector(data, attr) {
    // const sectorBar = []
    const bar = {}
    data.attendees.forEach(attendee => {
        attendee[attr].forEach(item => {
            bar[item] = (bar[item] || 0) + 1;
        })
    })

    console.log(bar)

    const barsArray = Object.entries(bar).map(([name, value]) => ({ name, value }));
    barsArray.sort((a, b) => a.value - b.value);

    console.log("barsArray", barsArray)

    return barsArray
}


// AREA NETWORK
function network(networkData) {
    const width = viewportWidth;
    const height = viewportHeight;

    const areas = networkData.nodes.map(node => node.id);

    const greyCount = areas.length - colorPalette.length;
    const greyPalette = Array(greyCount).fill(defaultGrey);
    
    const colorScale = d3.scaleOrdinal()
        .domain(areas)
        .range([...colorPalette, ...greyPalette]);
 
    const svg = d3.select("#network").append("svg")
        .attr("width", width * 0.8)
        .attr("height", height);

    console.log("Original links", networkData)

    let colaNetwork = {};
    colaNetwork.links = [];
    colaNetwork.nodes = Object.assign([], networkData.nodes);

    var counter = 0

    for (let node of colaNetwork.nodes) {
        node.index = counter
        counter++
    }

    function getIndexFromNodeId( nodeArray, idStr) {
        for (const node of nodeArray) {
            if (node.id === idStr) {
                return node.index;
            }
        }
        return 65535;
    }

    for(let linkIndex=0; linkIndex < networkData.links.length; linkIndex++) {
        colaNetwork.links.push({
            source: getIndexFromNodeId(colaNetwork.nodes, networkData.links[linkIndex].source),
            target: getIndexFromNodeId(networkData.nodes, networkData.links[linkIndex].target),
            value: networkData.links[linkIndex].value
        })
    }

    console.log(colaNetwork)

    // Scales for node degree and link degree
    const nodeScale = d3.scaleLinear()
        .domain([d3.min(colaNetwork.nodes, d => d.degree), d3.max(colaNetwork.nodes, d => d.degree)])
        .range([3, 40]);

    const linkScale = d3.scaleLinear()
        .domain([d3.min(colaNetwork.links, d => d.value), d3.max(colaNetwork.links, d => d.value)])
        .range([1, 20]);

    const defs = svg.append("defs");

    const dropShadowFilter = defs.append("filter")
        .attr("id", "drop-shadow")
        .attr("width", "200%")
        .attr("height", "200%");

    dropShadowFilter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 4)
        .attr("result", "blur");

    dropShadowFilter.append("feOffset")
        .attr("in", "blur")
        .attr("dx", 5)
        .attr("dy", 5)
        .attr("result", "offsetBlur");

    const feMerge = dropShadowFilter.append("feMerge");

    feMerge.append("feMergeNode")
        .attr("in", "offsetBlur");
    feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");

    var d3cola = cola.d3adaptor(d3)
        .size([width*0.8, height]);
        
        delete d3cola._lastStress;
        delete d3cola._alpha;
        delete d3cola._descent;
        delete d3cola._rootGroup;

    d3cola
        .nodes(colaNetwork.nodes)
        .links(colaNetwork.links)
        .defaultNodeSize(100)
        .linkDistance(100)
        // .symmetricDiffLinkLengths(22)
        .jaccardLinkLengths(180, 1.9)
        // .handleDisconnected(false)
        .avoidOverlaps(true)
        .start();
  
    const links = svg.append("g")
        .selectAll("line")
        .data(colaNetwork.links.slice(0,54))
        .enter().append("line")
        .style("stroke", strokeHighlight)
        .style("stroke-opacity", 0.8)
        .style("stroke-width", d => linkScale(d.value));

    const linkLow = svg.append("g")
        .selectAll("line")
        .data(colaNetwork.links.slice(54, 720))
        .enter().append("line")
        .style("stroke", strokeHighlight)
        .style("stroke-opacity", 0.2)
        .style("stroke-width", d => linkScale(d.value));

    const linkSmall = svg.append("g")
        .selectAll("line")
        .data(colaNetwork.links.slice(720, 900))
        .enter().append("line")
        .style("stroke", strokeHighlight)
        .style("stroke-opacity", 0.05)
        .style("stroke-width", d => linkScale(d.value));

    const fontScale =  d3.scaleLinear()
        .domain([d3.min(networkData.nodes, d => d.degree), d3.max(networkData.nodes, d => d.degree)])
        .range([9, 50]);

    const labelsLow = svg.append("g")
        .selectAll("text")
        .data([...colaNetwork.nodes].reverse().slice(0, -12))
        .enter().append("text")
        .text(d => d.id)
        .style("font-size", d => `${fontScale(d.degree)}px`)
        .attr("class", "shadow") 
        .attr("font-weight", 200)
        .attr("fill", strokeHighlight)
        .attr("opacity", 0.8)
        .attr("dx", 12)
        .attr("dy", ".35em");

    const nodes = svg.append("g")
        .selectAll("circle")
        .data(colaNetwork.nodes)
        .enter().append("circle")
            .attr("r", d => nodeScale(d.degree))
            .attr("width", 100)
            .attr("height", 100)
            .style("fill", d => colorScale(d.id))
            .style("filter", "url(#drop-shadow)");

    const labels = svg.append("g")
        .selectAll("text")
        .data([...colaNetwork.nodes].reverse().slice(-12))
        .enter().append("text")
        .text(d => d.id)
        .style("font-size", d => `${fontScale(d.degree)}px`)
        .attr("class", "shadow") 
        // .attr("text-anchor", "middle")
        .attr("font-weight", 300)
        .attr("fill", strokeHighlight)
        .attr("dx", 0)
        .attr("dy", ".35em");

    d3cola.on('tick', function() {
        console.log('tick calculation');
        nodes
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    
        links
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        labels
            .attr("x", d => d.x)
            .attr("y", d => d.y);

        labelsLow
            .attr("x", d => d.x)
            .attr("y", d => d.y);

        linkLow
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        linkSmall
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
    });

    
}

// ARC DIAGRAM
function arc(networkData) {
    const width = viewportWidth;
    const height = viewportHeight - 20;

    const margin = {top: 20, right: 30, bottom: 40, left: 80}

    const areas = networkData.nodes.map(node => node.id);
    const y = d3.scalePoint(areas, [height * 0.5 - width * 0.2, height * 0.5 + width * 0.2]);
    const Y = new Map(networkData.nodes.map(({id}) => [id, y(id)]));

    // Scales for node degree and link degree
    const nodeScale = d3.scaleLinear()
        .domain([d3.min(networkData.nodes, d => d.degree), d3.max(networkData.nodes, d => d.degree)])
        .range([5, 20]);

    const linkScale = d3.scaleLinear()
        .domain([d3.min(networkData.links, d => d.value), d3.max(networkData.links, d => d.value)])
        .range([1, 15]);

    const colorScale = d3.scaleOrdinal()
        .domain(areas)
        .range(colorPalette);

    const svg = d3.select("#arc")
        .append("svg")
          .attr("width", width * 0.35)
          .attr("height", height)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")")
        .style("fill", "none")
        .attr("stroke", strokeHighlight)
    
    // Add an arc for each link.
    function arc(d) {
        const y1 = Y.get(d.source);
        const y2 = Y.get(d.target);
        const r = Math.abs(y2 - y1) / 2;
        return `M${margin.left},${y1}A${r},${r} 0,0,${y1 < y2 ? 1 : 0} ${margin.left},${y2}`;
    }

    const fontScale =  d3.scaleLinear()
        .domain([d3.min(networkData.nodes, d => d.degree), d3.max(networkData.nodes, d => d.degree)])
        .range([10, 20]);

    const path = svg.insert("g", "*")
            .selectAll("path")
            .data(networkData.links)
            .join("path")
            .attr("stroke", strokeHighlight)
            .attr("d", arc)
            .attr("fill", "none")
            .attr("stroke-opacity", 0.5)
            .attr("stroke-width", d => linkScale(d.value));

    // Add a text label and a dot for each node.
    const label = svg.append("g")  
            .attr("font-weight", 300)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(networkData.nodes)
            .join("g")
            .attr("transform", d => `translate(${margin.left},${Y.get(d.id)})`)
            .call(g => g.append("text")
                .attr("x", -25)
                .attr("dy", "0.35em")
                .attr("fill", strokeHighlight)
                .attr("font-size", d => `${fontScale(d.degree)}px`)
                .text(d => d.id))
            .call(g => g.append("circle")
                .attr("r", d => nodeScale(d.degree))
                .attr("fill", d => colorScale(d.id)))
                .attr("stroke", "none");

    // const step = 20;
    
    // Add invisible rects that update the class of the elements on mouseover.
    // label.append("rect")
    //         .attr("fill", "none")
    //         .attr("width", margin.left + 40)
    //         .attr("height", step)
    //         .attr("x", -margin.left)
    //         .attr("y", -step / 2)
    //         .attr("fill", "none")
    //         .attr("pointer-events", "all")
    //         .on("pointerenter", (event, d) => {
    //             svg.classed("hover", true);
    //             label.classed("primary", n => n === d);
    //             label.classed("secondary", n => networkData.links.some(({source, target}) => (
    //                 n.id === source && d.id == target || n.id === target && d.id === source
    //             )));
    //             path.classed("primary", l => l.source === d.id || l.target === d.id).filter(".primary").raise();
    //         })
    //         .on("pointerout", () => {
    //             svg.classed("hover", false);
    //             label.classed("primary", false);
    //             label.classed("secondary", false);
    //             path.classed("primary", false).order();
    //         });

    // Add styles for the hover interaction.
    // svg.append("style").text(`
    //     .hover text { fill: #aaa; }
    //     .hover g.primary text { font-weight: bold; fill: #333; }
    //     .hover g.secondary text { fill: #333; }
    //     .hover path { stroke: #ccc; }
    //     .hover path.primary { stroke: #333; }
    // `);
}

// CHORD MATRIX
function chord(network, matrix) {
    const width = viewportWidth;
    const height = viewportHeight - 20;
    const margin = {top: 20, right: 30, bottom: 40, left: 80}

    // const outerRadius = Math.min(width, height) * 0.5;
    // const innerRadius = outerRadius - 20;

    const outerRadius = width * 0.2 - 40;
    const innerRadius = outerRadius - 20;

    const areas = network.nodes.map(node => node.id);

    const sum = d3.sum(matrix.flat());
    const tickStep = d3.tickStep(0, sum, 100);
    const tickStepMajor = d3.tickStep(0, sum, 20);
    const formatValue = d3.formatPrefix(",.0", tickStep);

    function groupTicks(d, step) {
        const k = (d.endAngle - d.startAngle) / d.value;
        return d3.range(0, d.value, step).map(value => {
          return {value: value, angle: value * k + d.startAngle};
        });
    }

    const chord = d3.chord()
      .padAngle(10 / innerRadius)
      .sortSubgroups(d3.descending);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = d3.ribbon()
      .radius(innerRadius);

    const svgAspectRatio = (width * 0.4) / height;
    const viewBoxWidth = 2 * outerRadius + 50;
    const viewBoxHeight = viewBoxWidth / svgAspectRatio;

    const svg = d3.select("#chord")
        .append("svg")
            .attr("width", width * 0.4)
            .attr("height", height)
            .attr("viewBox", [-viewBoxWidth / 2, -viewBoxHeight / 2, viewBoxWidth, viewBoxHeight]);

    // const svg = d3.select("#chord")
    //     .append("svg")
    //         .attr("width", width * 0.4)
    //         .attr("height", height)
    //         .attr("viewBox", [-outerRadius, -outerRadius, 2 * outerRadius, 2 * outerRadius]); 
            // .attr("viewBox", [-width / 2, -height / 2, width, height-20]);
            // .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    const chords = chord(matrix);

    const group = svg.append("g")
        .selectAll()
        .data(chords.groups)
        .join("g");

    // add the outer layer archs
    group.append("path")
        .attr("fill", d => colorPalette[d.index])
        .attr("d", arc)
        .attr("id", d => "arc-" + d.index)
        .append("title")
        .text(d => `${d.value.toLocaleString("en-US")} ${areas[d.index]}`);

    group.append("text")
        .attr("dy", "-0.25em")
        .append("textPath")
            .attr("href", d => "#arc-" + d.index)
            .attr("startOffset", "1%")
            .text(d => areas[d.index])
            .attr("font-size", "15px")
            .attr("font-weight", 500)
            .attr("fill", strokeHighlight);

    // const groupTick = group.append("g")
    //     .selectAll()
    //     .data(d => groupTicks(d, tickStep))
    //     .join("g")
    //         .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);

    // groupTick.append("line")
    //     .attr("stroke", "none")
    //     .attr("x2", 6);

    // groupTick
    //     .filter(d => d.value % tickStepMajor === 0)
    //     .append("text")
    //         .attr("x", 8)
    //         .attr("dy", ".35em")
    //         .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-16)" : null)
    //         .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
    //         .text(d => formatValue(d.value));

    svg.append("g")
        .attr("fill-opacity", 0.7)
        .selectAll()
        .data(chords)
        .join("path")
            .attr("d", ribbon)
            .attr("fill", d => colorPalette[d.target.index])
            .attr("stroke", strokeHighlight)
            .attr("stroke-opacity", 0.6)
        .append("title")
            .text(d => `${d.source.value.toLocaleString("en-US")} ${areas[d.source.index]} → ${areas[d.target.index]}${d.source.index !== d.target.index ? `\n${d.target.value.toLocaleString("en-US")} ${areas[d.target.index]} → ${areas[d.source.index]}` : ``}`);

    return svg.node();
    
}

function nestedSectorPack(data, networkData) {
    const dataSource = data.data;
    const areas = networkData.nodes.map(node => node.id);

    const hierarchyData = {
        name: "root",
        children: Array.from(d3.group(dataSource, d => d.group_name))
            .filter(group => group[0] !== "unemployed")
            .map(group => ({
                name: group[0],
                children: group[1].map(d => ({
                    name: d.type,
                    value: d.count
                }))
            }))
    };

    const width = viewportWidth * 0.8;
    const height = viewportHeight;

    const mainSvg = d3.select("#beeswarm").append("svg")
        .attr("width", width)
        .attr("height", height - paddingTopForTitles);

    const greyCount = areas.length - colorPalette.length;
    const greyPalette = Array(greyCount).fill(defaultGrey);
    
    const colorScale = d3.scaleOrdinal()
        .domain(areas)
        .range([...colorPalette, ...greyPalette]);

    const pack = d3.pack()
        .size([width, height- paddingTopForTitles])
        .padding(d => {
            return d.depth == 0 ? 50 : 5;
        });

    const root = d3.hierarchy(hierarchyData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    pack(root);

    const fontSizeScale = d3.scaleLinear()
        .domain([d3.min(root.leaves(), leaf => leaf.data.value), d3.max(root.leaves(), leaf => leaf.data.value)])
        .range([10, 25]);

    const thresholdCount = 2;

    mainSvg.selectAll("myPath")
        .data(root.children)
        .enter()
        .append("path")
        .attr("id", (d, i) => "path" + i)
        .attr("d", d => `
            M ${d.x - d.r + 2}, ${d.y}
            a ${d.r - 2},${d.r - 2} 0 1,1 ${(d.r - 2) * 2},0
            a ${d.r - 2},${d.r - 2} 0 1,1 -${(d.r - 2) * 2},0
        `)
        .style("fill", "none")
        .style("stroke", "none");

    // packed circles
    mainSvg.selectAll("circle")
        .data(root.descendants())
        .join("circle")
        .attr("fill", d => d.depth === 0 ? "none" : (d.children ? "#282828" : colorScale(d.data.name)))
        .attr("fill-opacity", 0.8)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.r)
        .attr("stroke", d => d.depth === 0 ? "none" : (d.children ? "#ccc" : strokeHighlight));

    mainSvg.selectAll("text")
        .data(root.children)
        .enter()
        .append("text")
        .style("fill", "white")
        .style("font-size", "18px")
        .attr("dy", "-0.5em")
        .append("textPath")
        .attr("xlink:href", (d, i) => "#path" + i)
        .style("text-anchor", "middle")
        .attr("startOffset", "25%")
        .text(d => d.data.name.toUpperCase());
    
    mainSvg.selectAll("bubbleText")
        .data(root.leaves())
        .enter()
        .filter(d => d.data.value > thresholdCount)
        .append("text") 
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("text-anchor", "middle")
            .attr("dy", "0em")
            .style("fill", strokeHighlight)
            .style("font-size", d => fontSizeScale(d.data.value) + "px")
            .text(d => d.data.name);

    mainSvg.selectAll("bubbleNum")
        .data(root.leaves())
        .enter()
        .filter(d => d.data.value > thresholdCount)
        .append("text") 
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("text-anchor", "middle")
            .attr("dy", "1em")
            .style("fill", strokeHighlight)
            .style("font-size", d => fontSizeScale(d.data.value) + "px")
            .text(d => d.data.value);
    
    return mainSvg.node();
}

function stackBar(data) {
    const barWidth = 30;
    const height = viewportHeight/3;
    const margin = {top: 20, right: 30, bottom: 40, left: 20};

    const yScale = d3.scaleLinear([0, 1], [height, 0]);
    var formatPercent = yScale.tickFormat(null, "%");

    var stack = function() {
        const total = d3.sum(data, d => d.value);
        let value = 0;
        return data.map(d => ({
            name: d.name,
            value: d.value / total,
            startValue: value / total,
            endValue: (value += d.value) / total
        }));
    };

    const svg = d3.select("#beeswarm").select("svg");
    const barGroup = svg.append("g")
        .attr("transform", `translate(${viewportWidth*0.7 - barWidth - margin.right}, ${margin.top})`);

    barGroup.append("g")
        .attr("stroke", "white")
        .selectAll("rect")
        .data(stack())
        .join("rect")
        .attr("fill", "black")
        .attr("y", d => yScale(d.endValue))
        .attr("x", 0)
        .attr("height", d => yScale(d.startValue) - yScale(d.endValue))
        .attr("width", barWidth)
        .append("title")
        .text(d => `${d.name}${formatPercent(d.value)}`);
    
    barGroup.append("g")
        .attr("font-size", 12)
        .selectAll("text")
        .data(stack())
        .join("text")
        .attr("fill", "white")
        .attr("transform", d => `translate(6, ${yScale(d.endValue) + 6})`)
        .call(text => text.append("tspan")
            .attr("x", barWidth + 5)
            .attr("y", "0.3em")
            .text(d => d.name))
        .call(text => text.append("tspan")
            .attr("x", barWidth + 5)
            .attr("y", "1.3em")
            .attr("fill-opacity", 0.7)
            .text(d => formatPercent(d.value)));
}


// FETCH DATA AND RENDER
fetch(dataPath)
    .then(response => response.json())
    .then(data => {
        const networkData = transformToNetwork(data, "areas_cleaned");

        const networkDataShort = transformToNetwork(data, "areas_short");
        const matrixData = transformToMatrix(networkDataShort);
    
        arc(networkDataShort);
        network(networkData);
        chord(networkDataShort, matrixData);

        const groupedData = transformToGroup(data, "areas_grouped", "sectors_cleaned");
        nestedSectorPack(groupedData, networkData);

        const barData = transformToSector(data, "career");
        stackBar(barData);

    });