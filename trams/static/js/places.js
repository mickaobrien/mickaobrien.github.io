(function() {
    //Add google places autocomplete
    var searchBoxes = $('#origin, #destination');
    var options = {
        location: new google.maps.LatLng(55.9531, 3.1889), 
        radius: 10000,
        componentRestrictions: {country: 'gb'}
    };

    var i, input;
    for(i=0; i<searchBoxes.length; i++) {
        input = searchBoxes[i];
        new google.maps.places.Autocomplete(input, options);
    }
})();


(function() {
    var FARE = 1.5;
    var AIRPORT_FARE = {Bus: 4, Tram: 5};
    var MIN_WAGE = 6.31;
    var AIRPORT_ADDRESS = 'Edinburgh Airport (EDI), Edinburgh, City of Edinburgh EH12 9DN, UK';

    var ROUTES;
    function calcRoute(start, end) {
        var directionsService = new google.maps.DirectionsService();

        //var start = $('#origin').val();
        //var end = $('#destination').val();
        var request = {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.TRANSIT,
            provideRouteAlternatives: true
        };
        directionsService.route(request, function(result, status) {
            if (status==google.maps.DirectionsStatus.OK) {
                var routes = result['routes'];
                var route, i;
                updateRoutes(result['routes']);
                result['routes'] = _.sortBy(result['routes'], function(route) { return route.total_cost; });
                //console.log(_.pluck(result['routes'], 'modes'));
                //console.log(_.pluck(result['routes'], 'cost'));

                ROUTES=result;
                directionsDisplay.setDirections(result);
                //$('#map').show();
                console.log('oo');
                $('#map').css('visibility', 'visible');
                showTramImage(0, result['routes']);

            }
        });
    }

    var directionsDisplay;
    var directionsService = new google.maps.DirectionsService();
    var map;

    function initialise() {
        //Create map
        directionsDisplay = new google.maps.DirectionsRenderer();
        var edinburgh = new google.maps.LatLng(55.9531, -3.1889);
        var mapOptions = {
            zoom: 12,
            center: edinburgh
        };
        map = new google.maps.Map(document.getElementById('map'), mapOptions);
        directionsDisplay.setMap(map);
        directionsDisplay.setPanel(document.getElementById('results'));
    }
    google.maps.event.addDomListener(window, 'load', initialise);

    function updateRoutes(routes) {
        //Add all calculated fields to routes
        _.each(routes, addInfo);
    }

    function addInfo(route) {
        route['modes'] = getModes(route);
        route['cost'] = cost(route);
        route['duration'] = getDuration(route);
        route['total_cost'] = route['cost'] + timeCost(route);
    }

    function getDuration(route) {
        return route['legs'][0]['duration']['value'];
    }

    function getModes(route) {
        var steps = route['legs'][0]['steps'];
        var instructions = _.pluck(steps, 'instructions');
        var modes = _.map(instructions, function(i) { return i.split(' ')[0]; });
        return modes;
    }

    function cost(route) {
        var modes = getModes(route);
        var tramBus = _.filter(modes, function(mode) { return (mode!='Walk'); } );// || (mode==='Tram'); });

        //Only walking
        if (tramBus.length===0) {
            return 0;
        }

        var endAddress = route['legs'][0]['end_address'];
        var startAddress = route['legs'][0]['start_address'];
        var steps = route['legs'][0]['steps'];
        var transitSteps = _.filter(steps, function(step) { return _.has(step, 'transit'); });
        var numbers = _.map(transitSteps, function(step){ return step.transit.line.short_name; });
        var lastMode = tramBus[tramBus.length-1];
        var firstMode = tramBus[0];

        var expensiveLastMode = (lastMode==='Tram' || _.contains(numbers, '100'));
        var expensiveFirstMode = (firstMode==='Tram' || _.contains(numbers, '100'));
        var fare;
        if (endAddress===AIRPORT_ADDRESS && expensiveLastMode) {
            fare = FARE*(tramBus.length-1) + AIRPORT_FARE[lastMode];
        } 
        else if (startAddress===AIRPORT_ADDRESS && expensiveFirstMode) {
            fare = FARE*(tramBus.length-1) + AIRPORT_FARE[firstMode];
        }
        else {
            fare = FARE*tramBus.length;
        }

        return fare;
    }

    function timeCost(route) {
        var duration = getDuration(route);
        var durationInHours = duration/3600;
        return MIN_WAGE*durationInHours;
    }

    function showTramImage(routeNumber, routes) {
        //Show the appropriate tram/nae tram image for a given route
        var tram = hasTram(routeNumber, routes);
        if (tram) {
            $('#nae-tram').hide();
            $('#aye-tram').show();
        } else {
            $('#aye-tram').hide();
            $('#nae-tram').show();
        }
    }

    function hasTram(routeNumber, routes) {
        var modes = getModes(routes[routeNumber]);
        return _.contains(modes, 'Tram');
    }


    //FORM
    $('form').submit(function(e) {
        e.preventDefault();
        var start = $('#origin').val();
        var end = $('#destination').val();

        if (start && end) {
            calcRoute(start, end);
        } else if (start) {
            $('#destination').focus();
        }
    });

    $('#results').on('click', function(e) {
        //Update tram image when different route is selected
        var routeNumber = $(e.target).closest('li').prevAll().length;
        showTramImage(routeNumber, ROUTES['routes']);
    });
})();
