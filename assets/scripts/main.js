var w = 1200;
var h = 1200;
var barPadding = 1;
var rows;
var maxCap;
var minCap;
var capScale;

var dataPath = "assets/data/trips_med.csv";
var dataNeighborhoods = "assets/data/neighborhoods.json";
var dataDivvyStations = "assets/data/stations.csv";

var projection = d3.geo.albers()
                        .scale(200000)
                        .center([0, 41.84562])
                        .rotate([87.65533, 0])
                        .translate([h/2, w/2]);

var path = d3.geo.path().projection(projection);

var svg = d3.select("#results").append("svg")
          .attr("width", w)
          .attr("height", h)
          .call(d3.behavior.zoom()
          .on("zoom", redraw))
          .append("g");

var setScale = function(dataset) {
  maxCap = d3.max(dataset, function(d) {
    return d.cap;
  });

  minCap = d3.min(dataset, function(d) {
    return d.cap;
  });

  capScale = d3.scale
               .linear()
               .domain([minCap, maxCap])
               .range([0,10]);

  return capScale;
};

function redraw() {
    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
      .selectAll("path")
      .style({"stroke-width" : (1/d3.event.scale)});
}

var parseNeighborhoods = function() {
  d3.json(dataNeighborhoods, function(error, data) {
    drawNeighborhoods(data);
    parseStations();
  });
};

var drawNeighborhoods = function(d) {
  svg.selectAll("path")
    .data(d.features)
    .enter()
    .append("path")
    .attr("d", path)
    .style({"fill": "#444a4a", "stroke" : "#242626", "stroke-width": 1});
};

var drawStations = function(d) {
  svg.selectAll("circle")
      .data(d)
      .enter()
      .append("circle")
      .attr("cx", function(d){
        return projection([d.lon, d.lat])[0];
      })
      .attr("cy", function(d) {
        return projection([d.lon, d.lat])[1];
      })
      .attr("r", function(d) {
        return capScale(d.cap);
      })
      .style("fill", "#3db7e4")
      .style("opacity", 0.75);
};

var parseStations = function() {
  d3.csv(dataDivvyStations, function(d) {
    return {
      name: d.name,
      lat: +d.latitude,
      lon: +d.longitude,
      cap: +d.dpcapacity
    };
  }, function(error, data){
    setScale(data);
    drawStations(data);
  });

};

var parseTrips = function() {
  d3.csv(dataPath, function(d) {
    return {
      tripID: +d.trip_id,
      tripStart: new Date(d.starttime),
      tripStop: new Date(d.stoptime),
      tripDuration: +d.tripduration.replace(/[^\d\.\-\ ]/g, ""),
      bikeID: +d.bikeid,
      stationFromID: +d.from_station_id,
      stationFromName: d.from_station_name,
      stationToID: +d.to_station_id,
      stationToName: d.to_station_name,
      userType: d.usertype,
      userGender: d.gender,
      userBirthYear: new Date(d.birthyear)
    };
  }, function(error, rows) {
  });
};

var logData = function(data) {
  data.forEach(function(d){
    console.log(d);
  });
};

var chartBars = function(dataset) {

  svg.selectAll("rect")
   .data(dataset)
   .enter()
   .append("rect")
   .attr("x", function(d, i) {
    return i * (w / dataset.length);
   })
   .attr("y", function(d) {
    return h - d.tripDuration / 100;
   })
   .attr("width", w / dataset.length - barPadding)
   .attr("height", function(d) {
    return d.tripDuration / 100;
   });
};

// Call the function
parseTrips();
parseNeighborhoods();

