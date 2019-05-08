$(document).ready(() => {
    Rotation.init( $('#rotation') );
});

let Rotation = (() => {
    
    let settings = {};

    let buildSettings = (section) => {
        settings.scheduled = section.find( $('#scheduled') ) || console.error('No element with id "scheduled"');
        settings.flights = section.find( $('#flights') ) || console.error('No element with id "flights"');

        settings.turnaround = 40 * 60;
        settings.url = section.data('source') || false;

        settings.allFlights = []; // copy of all flights data

        settings.times = [];
        settings.locations = [];

        settings.scheduledFlights = [];
        settings.unscheduledFlights = [];
    }; 
    
    let sortFlights = (arr, prop) => {
        return arr.sort(function(ob1, ob2) {
            return ob1[prop] - ob2[prop];
        });
    };

    let ifBetween = (start, end, num, inclusive) => {
        let min = Math.min(start, end);
        let max = Math.max(start, end);
        return inclusive ? num >= min && num <= max : num > min && num < max;  
    };

    // Initial display
    let getFlightsOnInit = (url) => {
        $.get(url, (data) => {
            // Sort the results on departure time and build settings.allFlights array to hold them all
            let sorted = sortFlights(data.data, 'departuretime');
            settings.allFlights = sorted;
                // On init both arrays should hold the same data 
                settings.unscheduledFlights = sorted;

            displayNotScheduledFlights(settings.unscheduledFlights);
        });
    };

    let getArrayPosition = (key, arr) => {
        for (let i in arr) {
            if ( arr[i]['id'] === key) {
                return i;
            }
        }
    };

    let checkTimeframe = (currentArrivalTime, currentDepartureTime, times) => {
        for (let i in times) {
            let firstTime = times[i][0] - settings.turnaround;
            let secondTime = +times[i][1] + settings.turnaround;
            if ( ifBetween(firstTime, secondTime, currentArrivalTime, false) || ifBetween(firstTime, secondTime, currentDepartureTime, false) ) {
                return false;
            } 
        }
        return true;
    };

    let checkLocation = (currentOrigin, currentDestination, locations) => {
        for (let i in locations) {
            if ( locations[i][0] == currentDestination || locations[i][1] == currentOrigin) {
                return true;
            } 
        }
        return false;
    };

    let scheduleSelected = (e) => {
        // Get selected record data from [settings.allFlights] and push it in [settings.scheduledFlights]
        settings.scheduledFlights.push(settings.allFlights[$(e.target).data('id')]);
        settings.times.push(
                [   
                    settings.allFlights[$(e.target).data('id')]['departuretime'], 
                    settings.allFlights[$(e.target).data('id')]['arrivaltime'] 
                ]
        );

        settings.locations.push(
            [   
                settings.allFlights[$(e.target).data('id')]['origin'], 
                settings.allFlights[$(e.target).data('id')]['destination'] 
            ]
        );
            
        // Reset this array since its data should be relevent to the selected flights...
        settings.unscheduledFlights = [];
    
        for (let k in settings.allFlights) {
            ($.inArray( settings.allFlights[k], settings.scheduledFlights ) == -1) && 
            checkTimeframe(+settings.allFlights[k].departuretime, +settings.allFlights[k].arrivaltime, settings.times) && 
            checkLocation(settings.allFlights[k].origin, settings.allFlights[k].destination, settings.locations) && 
            settings.unscheduledFlights.push(settings.allFlights[k]);
        }

        displayNotScheduledFlights( sortFlights(settings.unscheduledFlights, 'departuretime') );
        
        let sorted = sortFlights(settings.scheduledFlights, 'departuretime');
        displayScheduledFlights(sorted);
    };

    let templateForScheduled = (data) => {
        return `<div class="card">
                    <p>Aircraft ${data.id}</p>
                    <div class="flexContainer flexSpaceBetween">
                        <div class="departure">
                            ${data['origin']}<br/>${data['readable_departure']}
                        </div>
                        <div>
                            <i class="fas fa-arrow-right"></i>
                        </div>
                        <div class="arrival">
                            ${data['destination']}<br/>
                            ${data['readable_arrival']}
                        </div>
                    </div>
                </div>`;
    };

    let templateForNotScheduled = (data, id) => {
        // I've set the data-id to know the exact position of the current record in [settings.allFlights]
        return `<li class="flight" data-id="${id}" >
                    <i class="fas fa-arrow-left"></i> 
                    ${data.id} | 
                    ${data.origin} (${data.readable_departure}) | 
                    ${data.destination} (${data.readable_arrival})
                </li>`;
    };

    let displayScheduledFlights = (arr) => {
        let flights = '';
        
        for (let el in arr) {
            flights += templateForScheduled(arr[el]);
        };
        
        settings.scheduled.html(flights).fadeIn();
    };

    let displayNotScheduledFlights = (arr) => {
        let list = "";
        for (let i in arr) {
            list += templateForNotScheduled(arr[i], getArrayPosition(arr[i]['id'], settings.allFlights));
        }
        $('#flights').html(list).hide().fadeIn();
    };

    let loadAircraftData = (e) => {         
        $('.timeline-container').hide().fadeIn();
        
        // If more than one aircraft is displayed...
        $('.planes.selected').toggleClass('selected');
        
        let selectedPlane = $(e.target).closest('.planes');
        selectedPlane.toggleClass('selected');
        
        $('#scheduled').html('');

        // Empty scheduled flights array
        settings.scheduledFlights = [];

        // Get all flights for selected Aircraft (url should have some params)
        settings.url && getFlightsOnInit(settings.url);
    };

    let bindEvents = () => {
        $('.planes').off('click').on('click', loadAircraftData);
        $('body').on('click', 'li.flight', scheduleSelected);
    }; 
    
    let init = (section) => {
        buildSettings(section);
        bindEvents();
    };
    
    return { 
        init 
    };
    
})();
