// var w = 1200;
// var h = 1200;
var barPadding = 1;
var rows;
var maxCap,
    minCap;
var maxDuration,
    minDuration;
var capScale;

var win = window,
    doc = document,
    docEl = doc.documentElement,
    body = doc.getElementsByTagName('body')[0],
    w = win.innerWidth || docEl.clientWidth || body.clientWidth,
    h = win.innerHeight|| docEl.clientHeight|| body.clientHeight;

// function updateWindow(){
//     w = win.innerWidth || docEl.clientWidth || body.clientWidth,
//     h = w.innerHeight|| e.clientHeight|| g.clientHeight;

//     svg.attr("width", x).attr("height", y);
// }
// window.onresize = updateWindow;

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

var setDurationScale = function(dataset) {
  maxDuration = d3.max(dataset, function(d) {
    return d.tripDuration;
  });

  minDuration = d3.min(dataset, function(d) {
    return d.tripDuration;
  });

  durationScale = d3.scale
                    .linear()
                    .domain([minDuration, maxDuration])
                    .range([0, 100]);
}

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
  }, function(error, d) {

    setDurationScale(d);
    outputTrips(d);

  });
};

var outputTrips = function(data) {

    var tripsList = d3.select("#trips");

    var trips = tripsList.selectAll("li")
      .data(data)
      .enter()
      .append("li")
      .attr("class", "trip-list__trip trip")
      .style({
        "background-image": function(d) {
          var gradient = durationScale(d.tripDuration) * 10;

          return "linear-gradient(to right,#3DB7E4 " + gradient +"% ,#303333 "+(gradient+.001)+"%)"
        }
      });

    var tripStart = trips.append("div")
      .attr("class", "trip__start");

    var tripEnd = trips.append("div")
      .attr("class", "trip__end");


    tripStart.append("div")
          .attr("class", "trip__start-time")
          .append("text")
          .text(function(d) {
            return d.tripStart;
          });

    tripStart.append("div")
          .attr("class", "trip__start-station")
          .append("text")
          .text(function(d) {
            return d.stationFromName;
          });


    tripEnd.append("div")
          .attr("class", "trip__end-time")
          .append("text")
          .text(function(d) {
            return d.tripStop;
          });

    tripEnd.append("div")
          .attr("class", "trip__end-station")
          .append("text")
          .text(function(d) {
            return d.stationToName;
          });
}

//

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


// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.
