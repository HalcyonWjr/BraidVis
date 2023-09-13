var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
var viewportHeight = window.innerHeight || document.documentElement.clientHeight;

$("#selector").css({"top": 0, "height": viewportHeight, "width": viewportWidth * 0.2});
$("#network").css({"top": 0, "height": viewportHeight});
$("#n_button, #m_button, #o_button, #p_button, #title").css({"width": viewportWidth * 0.2, "height": viewportHeight * 0.195});
$("#image").css({"width": viewportWidth * 0.18});
$("#main_title").css({"width": viewportWidth * 0.8, right: 0});

const my_svg = d3
    .select("#mapid")
    .select("svg")
    .attr("width", viewportWidth * 0.8)
    .attr("height", viewportHeight);

const g = {
    basemap: my_svg.select("g#basemap"),
    flights: my_svg.select("g#flights"),
    airports: my_svg.select("g#airports"),
    voronoi: my_svg.select("g#voronoi"),
    };


let europeProjection = d3
    .geoMercator()
    .center([0, 54.5])
    .scale([viewportWidth * 1.7])
    .translate([viewportWidth/2, viewportHeight/2]);

d3.json("../data/europe.json").then(drawMap);
pathGenerator = d3.geoPath().projection(europeProjection);

const hypotenuse = Math.sqrt(viewportWidth * viewportWidth + viewportHeight * viewportHeight);

function drawMap(map) {
    g.basemap
        .selectAll("path")
        .data(map.features)
        .enter()
        .append("path")
        .attr("d", pathGenerator)
        .attr("stroke", "rgb(20, 20, 20)") // Color of the lines themselves
        .attr("fill", "#005B88");
}

let number = -1
setInterval(swapping, 18000)
function swapping () {
    number += 1;
    if (number > 3) {
        number = 0
    }

    if (number == 0) {
        d3.select("#n_button")
            .transition().duration(200)
            .style("border", "2px solid white")
        d3.select("#p_button")
            .transition().duration(200)
            .style("border", "2px solid #282828")

        d3.select("#network")
            .transition().duration(1000)
            .style("opacity", 1)
        d3.select("#beeswarm")
            .transition().duration(1000)
            .style("opacity", 0)
        d3.select("#title_in")
            .transition().duration(1000)
            .text("How do people in the RAI community self-identify across research areas?")
    }
    if (number == 1) {
        d3.select("#o_button")
            .transition().duration(200)
            .style("border", "2px solid white")
        d3.select("#n_button")
            .transition().duration(200)
            .style("border", "2px solid #282828")
        d3.select("#network")
            .transition().duration(1000)
            .style("opacity", 0)
        d3.select("#backup")
            .transition().duration(1000)
            .style("opacity", 1)
        d3.select("#title_in")
            .transition().duration(1000)
            .text("How do people in the RAI community self-identify across research areas?")
    }
    if (number == 2) {
        d3.select("#m_button")
            .transition().duration(200)
            d3.select("#o_button")
            .style("border", "2px solid white")
            .transition().duration(200)
            .style("border", "2px solid #282828")

        d3.select("#network")
            .transition().duration(1000)
            .style("opacity", 0)
        d3.select("#backup")
            .transition().duration(1000)
            .style("opacity", 0)            
        d3.select("#mapid")
            .transition().duration(1000)
            .style("opacity", 1)
        d3.select("#title_in")
            .transition().duration(1000)
            .text("Where are people in the RAI community located?")
    }
    if (number == 3) {
        d3.select("#p_button")
            .transition().duration(200)
            .style("border", "2px solid white")
        d3.select("#m_button")
            .transition().duration(200)
            .style("border", "2px solid #282828")
        d3.select("#mapid")
            .transition().duration(1000)
            .style("opacity", 0)
        d3.select("#beeswarm")
            .transition().duration(1000)
            .style("opacity", 1)
        d3.select("#title_in")
            .transition().duration(1000)
            .text("In which sectors do members of the RAI community work?")
    }
}

// d3.select("#beeswarm")
//         .style("opacity", 1)

// d3.select("#network, #mapid, #backup")
//         .style("opacity", 0)

Promise.all([d3.json("../data/sample.json")]).then(function (files) {
    let combat_null = d3.groups(files[0]['attendees'], (d) => d.geo.name != null);
    let noUk = d3.groups(combat_null[1][1], (d) => d.geo.country != "GB")
    let groupNoUk = d3.groups(noUk[1][1], (d) => d.geo.country)
    groupNoUk.sort(function(a, b) { return d3.ascending(a[1].length, b[1].length); })
    let geo = d3.groups(combat_null[0][1], (d) => d.geo.name)

    function typemyAirport(airport) {
        airport.forEach(function (d) {
            d.name = d[0]
            d.longitude = parseFloat(d[1][0].geo.longitude);
            d.latitude = parseFloat(d[1][0].geo.latitude);
            const coords = europeProjection([d.longitude, d.latitude]);
            d.x = coords[0];
            d.y = coords[1];
            d.outgoing = d[1].length;
            d.incoming = 0;
        });
        return airport;
        }

    braid_to_draw = typemyAirport(geo)

    let study_scales = {
        airports: d3.scaleLinear().range([4, 29]),
        texts: d3.scaleLinear().range([14, 16]),
      };

    function drawBubbles(airports) {

        console.log('here');
        // adjust scale
        const extent = d3.extent(airports, (d) => d.outgoing);
        study_scales.airports.domain(extent);

        // draw bubbles
        g.airports
          .selectAll("circle.airport")
          .data(airports)
          .enter()
          .append("circle")
          .attr("r", function (d) {
            return study_scales.airports(d.outgoing)
          })
          .attr("cx", (d) => d.x) 
          .attr("cy", (d) => d.y) 
          .attr("class", "airport")

        my_svg.selectAll("#text")
            .data(airports)
            .enter()
            .append("text")
            .attr("text-anchor", "left")
            // .attr("dx", "0.7em")
            .attr("dx", function (d){
                if (d.name == "Falkirk" || d.name == "Oxford") {
                    return "-5.2em"
                }
                else if ( d.name == "Kirkcaldy" || d.name == "Reading" || d.name == "Swindon") {
                    return "-6em"
                }
                else {
                    return "0.5em"
                }
            })
            .attr("dy", function(d){
                if (d.name == "Sunderland" || d.name == "Bromley" || d.name == "Canterbury" || d.name == "Reading") {
                    return "0.8em"
                }
                else if (d.name == "Swindon") {
                    return "0.4em"
                }
                else{
                    return "0.1em"
                }
            })
            .attr("class", "tooltip")
            .attr("x", (d) => d.x) 
            .attr("y", (d) => d.y) 
            .text(function(d){
                return d.name + " (" + d.outgoing + ")"
            })
            .style("font-size", function (d) {
                return study_scales.texts(d.outgoing)
            })

        g.airports
          .selectAll("#otherCircles")
          .data(groupNoUk)
          .enter()
          .append("circle")
          .attr("r", function (d) {
            return study_scales.airports(d[1].length)
          })
          .attr("cy", function (d, i){
            return viewportHeight - (i * 25 + 20)
          }) 
          .attr("cx", 50) 
          .attr("class", "otherCircles")

        my_svg.selectAll("#text")
            .data(groupNoUk)
            .enter()
            .append("text")
            .attr("text-anchor", "left")
            .attr("dx", function(d){
                if (d[1][0].country_international == "USA") {
                    return "0.7em"
                }
                else {
                    return "1em"
                }
            })
            .attr("class", "tooltip")
            .attr("x", 50) 
            .attr("y", function (d, i){
                return viewportHeight - (i * 25  + 15)
            }) 
            .text(function(d){
                return d[1][0].country_international + " (" + d[1].length + ")"
            })
            .style("font-size", function (d) {
                console.log(d);
                return study_scales.texts(d[1].length)
            })

      }

    drawBubbles(braid_to_draw)

})
