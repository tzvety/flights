"use strict";

$(document).ready(function () {
  Rotation.init($('#rotation'));
});

var Rotation = function () {
  var settings = {};

  var buildSettings = function buildSettings(section) {
    settings.scheduled = section.find($('#scheduled')) || console.error('No element with id "scheduled"');
    settings.flights = section.find($('#flights')) || console.error('No element with id "flights"');
    settings.turnaround = 40 * 60;
    settings.url = section.data('source') || false;
    settings.allFlights = []; // copy of all flights data

    settings.times = [];
    settings.locations = [];
    settings.scheduledFlights = [];
    settings.unscheduledFlights = [];
  };

  var sortFlights = function sortFlights(arr, prop) {
    return arr.sort(function (ob1, ob2) {
      return ob1[prop] - ob2[prop];
    });
  };

  var ifBetween = function ifBetween(start, end, num, inclusive) {
    var min = Math.min(start, end);
    var max = Math.max(start, end);
    return inclusive ? num >= min && num <= max : num > min && num < max;
  }; // Initial display


  var getFlightsOnInit = function getFlightsOnInit(url) {
    $.get(url, function (data) {
      // Sort the results on departure time and build settings.allFlights array to hold them all
      var sorted = sortFlights(data.data, 'departuretime');
      settings.allFlights = sorted; // On init both arrays should hold the same data 

      settings.unscheduledFlights = sorted;
      displayNotScheduledFlights(settings.unscheduledFlights);
    });
  };

  var getArrayPosition = function getArrayPosition(key, arr) {
    for (var i in arr) {
      if (arr[i]['id'] === key) {
        return i;
      }
    }
  };

  var checkTimeframe = function checkTimeframe(currentArrivalTime, currentDepartureTime, times) {
    for (var i in times) {
      var firstTime = times[i][0] - settings.turnaround;
      var secondTime = +times[i][1] + settings.turnaround;

      if (ifBetween(firstTime, secondTime, currentArrivalTime, false) || ifBetween(firstTime, secondTime, currentDepartureTime, false)) {
        return false;
      }
    }

    return true;
  };

  var checkLocation = function checkLocation(currentOrigin, currentDestination, locations) {
    for (var i in locations) {
      if (locations[i][0] == currentDestination || locations[i][1] == currentOrigin) {
        return true;
      }
    }

    return false;
  };

  var scheduleSelected = function scheduleSelected(e) {
    // Get selected record data from [settings.allFlights] and push it in [settings.scheduledFlights]
    settings.scheduledFlights.push(settings.allFlights[$(e.target).data('id')]);
    settings.times.push([settings.allFlights[$(e.target).data('id')]['departuretime'], settings.allFlights[$(e.target).data('id')]['arrivaltime']]);
    settings.locations.push([settings.allFlights[$(e.target).data('id')]['origin'], settings.allFlights[$(e.target).data('id')]['destination']]); // Reset this array since its data should be relevent to the selected flights...

    settings.unscheduledFlights = [];

    for (var k in settings.allFlights) {
      $.inArray(settings.allFlights[k], settings.scheduledFlights) == -1 && checkTimeframe(+settings.allFlights[k].departuretime, +settings.allFlights[k].arrivaltime, settings.times) && checkLocation(settings.allFlights[k].origin, settings.allFlights[k].destination, settings.locations) && settings.unscheduledFlights.push(settings.allFlights[k]);
    }

    displayNotScheduledFlights(sortFlights(settings.unscheduledFlights, 'departuretime'));
    var sorted = sortFlights(settings.scheduledFlights, 'departuretime');
    displayScheduledFlights(sorted);
  };

  var templateForScheduled = function templateForScheduled(data) {
    return "<div class=\"card\">\n                    <p>Aircraft ".concat(data.id, "</p>\n                    <div class=\"flexContainer flexSpaceBetween\">\n                        <div class=\"departure\">\n                            ").concat(data['origin'], "<br/>").concat(data['readable_departure'], "\n                        </div>\n                        <div>\n                            <i class=\"fas fa-arrow-right\"></i>\n                        </div>\n                        <div class=\"arrival\">\n                            ").concat(data['destination'], "<br/>\n                            ").concat(data['readable_arrival'], "\n                        </div>\n                    </div>\n                </div>");
  };

  var templateForNotScheduled = function templateForNotScheduled(data, id) {
    // I've set the data-id to know the exact position of the current record in [settings.allFlights]
    return "<li class=\"flight\" data-id=\"".concat(id, "\" >\n                    <i class=\"fas fa-arrow-left\"></i> \n                    ").concat(data.id, " | \n                    ").concat(data.origin, " (").concat(data.readable_departure, ") | \n                    ").concat(data.destination, " (").concat(data.readable_arrival, ")\n                </li>");
  };

  var displayScheduledFlights = function displayScheduledFlights(arr) {
    var flights = '';

    for (var el in arr) {
      flights += templateForScheduled(arr[el]);
    }

    ;
    settings.scheduled.html(flights).fadeIn();
  };

  var displayNotScheduledFlights = function displayNotScheduledFlights(arr) {
    var list = "";

    for (var i in arr) {
      list += templateForNotScheduled(arr[i], getArrayPosition(arr[i]['id'], settings.allFlights));
    }

    $('#flights').html(list).hide().fadeIn();
  };

  var loadAircraftData = function loadAircraftData(e) {
    $('.timeline-container').hide().fadeIn(); // If more than one aircraft is displayed...

    $('.planes.selected').toggleClass('selected');
    var selectedPlane = $(e.target).closest('.planes');
    selectedPlane.toggleClass('selected');
    $('#scheduled').html(''); // Empty scheduled flights array

    settings.scheduledFlights = []; // Get all flights for selected Aircraft (url should have some params)

    settings.url && getFlightsOnInit(settings.url);
  };

  var bindEvents = function bindEvents() {
    $('.planes').off('click').on('click', loadAircraftData);
    $('body').on('click', 'li.flight', scheduleSelected);
  };

  var init = function init(section) {
    buildSettings(section);
    bindEvents();
  };

  return {
    init: init
  };
}();
