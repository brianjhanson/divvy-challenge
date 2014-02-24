// var w = 1200;
// var h = 1200;
var barPadding = 1,
    rows,
    maxCap,
    minCap,
    maxDuration,
    minDuration,
    capScale,
    currentDate,
    dateArray = [],
    win = window,
    doc = document,
    docEl = doc.documentElement,
    body = doc.getElementsByTagName('body')[0],
    w = win.innerWidth || docEl.clientWidth || body.clientWidth,
    h = win.innerHeight|| docEl.clientHeight|| body.clientHeight,
    dataPath = "assets/data/trips_med.csv",
    dataNeighborhoods = "assets/data/neighborhoods.json",
    dataDivvyStations = "assets/data/stations.csv",
    speed = 500;

// function updateWindow(){
//     w = win.innerWidth || docEl.clientWidth || body.clientWidth,
//     h = w.innerHeight|| e.clientHeight|| g.clientHeight;

//     svg.attr("width", x).attr("height", y);
// }
// window.onresize = updateWindow;

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

var cleanDates = function(date) {

  var weekDayName = ["Sun.","Mon.","Tue.","Wed.","Thu.","Fri.","Sat."];
  var monthName = ["Jan.","Feb.","Mar.","Apr.","May","Jun.","Jul.","Aug.","Sep.","Oct.","Nov.","Dec."];
  var period = "AM",
      hour = date.getHours(),
      minutes = date.getMinutes();

  if(hour == 12) {
    period = "PM";
  } else if(hour > 12) {
    hour = hour-12;
    period = "PM";
  }

  if(minutes < 10) {
    minutes = "0"+date.getMinutes();
  }

  return {
    date: monthName[date.getMonth()] + " " + date.getDate() + " " + date.getFullYear(),
    day: weekDayName[date.getDay()],
    hour: hour + ":" + minutes + " " + period
  };
};

var parseTrips = function() {
  d3.csv(dataPath, function(d) {
    var startDateRaw = new Date(d.starttime),
        endDateRaw = new Date(d.stoptime);

    var startDate = cleanDates(startDateRaw);
    var endDate = cleanDates(endDateRaw);

    return {
      tripID: +d.trip_id,

      tripStartRaw: new Date(d.starttime),
      tripStartDate: startDate.date, // Ex: Feb. 12, 2014
      tripStartDay: startDate.day, // Ex: Thu.
      tripStartTime: startDate.hour,// Ex: 12:00p

      tripStopRaw: new Date(d.stoptime),
      tripStopDate: endDate.date,
      tripStopDay: endDate.day,
      tripStopTime: endDate.hour,

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
    logData(d);
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

    var tripStart = trips.append("div")
      .attr("class", "trip__start");

    var tripEnd = trips.append("div")
      .attr("class", "trip__end");

    trips.style({
        "background-position": "100%"
      })
      .transition()
      .duration(function(d){ return d.tripDuration * 10 })
      .delay(function(d) {
        dataStart = new Date("6/27/2013 12:11").getTime();
        delay = d.tripStartRaw.getTime() - dataStart;

        return delay / 1000;

      }) // data start - trip start time in ms
      .style({"background-position" : "0%" })
      .each("end", function() {
        d3.select(this).transition().duration(1000).delay(1000)
        .style({"opacity": "0"})
        .remove();
      })




    tripStart.append("div")
          .attr("class", "trip__start-time")
          .append("text")
          .text(function(d) {
            return d.tripStartDay + " " + d.tripStartDate + " " + d.tripStartTime;
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
            return d.tripStopDay + " " + d.tripStopDate + " " + d.tripStopTime;
          });

    tripEnd.append("div")
          .attr("class", "trip__end-station")
          .append("text")
          .text(function(d) {
            return d.stationToName;
          });
};

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

var startClock = function() {
  // Set the date to the start of the data
  var dataStartDate = new Date("Thu Jun 27 2013 12:11:00 GMT-0500 (CDT)");
  // convert date to milliseconds
  var currentDate_millisec = dataStartDate.getTime();
  // How fast do you want the clock to run?
  var offset = 60 * 1000;

  function Timer() {
    updateDate();
    setInterval(function() {
      updateDate();
      outputDate(currentDate);
    }, speed);
  }

  function updateDate() {
    currentDate = new Date(currentDate_millisec);
    currentDate_millisec += offset;

    return dateArray = [currentDate, currentDate_millisec];
  }

  function outputDate(date) {
    cleanedDate = cleanDates(date);
    prettyDate = cleanedDate.day + " " + cleanedDate.date + " " + cleanedDate.hour;
    document.getElementById("clock").innerHTML=prettyDate;
  }

  // start the timer
  Timer();
};


// Call the function
parseTrips();
parseNeighborhoods();
startClock();

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