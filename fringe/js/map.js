var Fringe = {

    init: function() {
        this.drawMap();

        //Load venue and show data in the background
        $.when(this.loadStaticData())
         .then(function() { 
             var b = $('button');
             b.text('Visualise');
             b.attr('disabled', false); 
         });
        var self = this;

        $('button').on('click', function(e) {
            e.preventDefault();
            $(this).text('Loading...');
            $.when(self.loadDayData())
             .then(function() {
                $('.animation').fadeIn();
                $('#intro').fadeOut();
            });
        });

    },

    drawMap: function() {
        var map = L.mapbox.map('map');
        map.zoomControl.removeFrom(map);
        map.setView([55.953100, -3.188900], 13);
        //map.zoomControl = false;
        disableInteractivity(map);
        //var stamenLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
              //attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
        //}).addTo(map);
        var customLayer = L.mapbox.tileLayer('-mick-.j15dkof3', {
              attribution: 'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
        }).addTo(map);

        this.map = map;
    },

    loadStaticData: function() {
        var self = this;
        var deferred = $.Deferred();
        d3.json('data/static_data.json', function(data) {
            self.shows = data.shows;
            self.venues = data.venues;
            deferred.resolve();
        });
        return deferred.promise();
    },

    loadDayData: function () {
        var self = this;
        var dayNumber = Math.floor(Math.random() * 25) + 1;

        var dataFile = 'data/8' + dayNumber + '.json';
        var deferred = $.Deferred();
        d3.json(dataFile, function(data) {
               self.performances = data.performances;
               self.categoryCounts = data.categories;
               self.count = data.count;
               self.busy = data.busy;
               self.date = dateTime(getTime(data.performances[0]['time'])).date;
               deferred.resolve();
               self.animate.call(self);
        });
        return deferred;
    },

    //loadData: function() {
        //var self = this;
        //d3.json('data/all_data.json', function(data) {
            //self.venues = data.venues;
            //self.shows = data.shows;
            //var performances = data.performances;
            //self.performances = performances;

            //self.startTime = getTime(performances[0].time);
            //self.endTime = getTime(performances[performances.length-1].time);
        
        //});
    //},

    //makeAnimation: function(error, staticData, performances) {
        //this.shows = staticData.shows;
        //this.venues = staticData.venues;

         ////Initialise svg
        //var map = this.map;
        //console.log(this);
        //map._initPathRoot();

        //this.animate(performances);
    //},

    setDayInfo: function() {
        var count = this.count;
        var busy = this.busy;
        var date = this.date;

        $('#date').text(date);
        $('#total-count').text(count);
        $('#busy').text(busy);
    },

    animate: function() {
        this.setDayInfo();
        
        var self = this;
        var venues = this.venues;
        var shows = this.shows;
        var events = this.performances;

        var circles = this.circles;

        var updateMap = this.updateMap;

        var currentTime = getTime(events[0].time);

        var interval = setInterval(function() {
            if (new Date(currentTime).getMinutes() % 5 === 0) {
                self.updateTime(currentTime);
            }

            if (events.length===0) {
                // check if any circles left
                d3.select('#map').selectAll('circle').remove();
                self.circles = {};
                self.updateShowCount(0);
                clearInterval(interval);
                $('#show-info').html('<button>See Another Day</button>')

                $('button').on('click', function(e) {
                    e.preventDefault();
                    $(this).text('Loading...');
                    $.when(self.loadDayData())
                     .then(function() {
                         $('#show-info').text('Click a show to get more info');
                     });
                });
                return;
            }


            if(currentTime===getTime(events[0].time)) {
                event = events.shift();
                event['events']['start'].forEach(function(e) {
                    circles[e.uid] = e;
                });
                event['events']['end'].forEach(function(e) {
                    delete circles[e.uid];
                });
                updateMap.call(self, d3.entries(circles));
                self.updateShowCount(Object.keys(circles).length);
            }
            currentTime = addMinutes(currentTime, 1);

        }, 300/6);
        this.interval = interval;
    },

    showsBreakdown: function(performances) {
        var shows = performances.map(function(t){ return t.events.start; })
        var merged = [];
        merged = merged.concat.apply(merged, shows);
        var showIDs = merged.map(function(p) { return p.sid; });

        //TODO FIX!
        var shows = this.shows;
        var categories = showIDs.map(function(sid) { return shows[sid].category; });

        var counts = {};
        for (var i = 0; i < arr.length; i++) {
                counts[arr[i]] = 1 + (counts[arr[i]] || 0);
        }
        return categories;
    },

    updateTime: function(time) {
        dateObj = dateTime(time);
        $('#current-time').text(dateObj.time);
    },

    updateShowCount: function(count) {
        $('#active-count').text(count);
    },

    updateMap: function(circles) { 
        var venues = this.venues;
        var shows = this.shows;

        var map = this.map;
        if (d3.select('#map').select('svg').empty()) {
            map._initPathRoot();
        }

        var svg = d3.select('#map').select('svg');
        if (d3.select('#map').select('svg').select('g').empty()) {
            var g = svg.append('g');
        } else {
            var g = d3.select('#map').select('g');
        }
        var dots = g.selectAll('circle');

        var radius = 6;

        var updateInfo = function(show) {
            var info = '<strong>' + shows[show.value.sid].name + '</strong> at <em>' + venues[show.value.v].name + '</em>'; 
            $('#show-info').html(info);
        }

        dots.data(circles, function(d) { return d.key; })
            .enter()
            .append('circle')
            .attr('cx', function(d) { return map.latLngToLayerPoint([venues[d.value.v].lat, venues[d.value.v].lng]).x; })
            .attr('cy', function(d) { return map.latLngToLayerPoint([venues[d.value.v].lat, venues[d.value.v].lng]).y; })
            .attr('class', function(d) { return categoryToClass(shows[d.value.sid].category); })
            .attr('r', radius)
            .attr('opacity', 0)
            .on('click', function(d) { updateInfo(d); })
            .on('touch', function(d) { updateInfo(d); })
            .transition(200/6)
            .attr('opacity', 1);


        dots.data(circles, function(d) { return d.key; })
            .exit()
            .transition()
            .duration(200/6)
            .attr('opacity', 0)
            .remove();
    },


    circles: {},

    d3Shit: function() {
        var map = this.map;
        map._initPathRoot();
        var svg = d3.select('#map').select('svg');
        var g = svg.append('g');

        var venues = this.venues;
        var shows = this.shows;
        var circles = this.circles;

        function updateMap(circles) { 
            var dots = g.selectAll('circle');
            var radius = 6;
            dots.data(circles, function(d) { return d.key; })
                .enter()
                .append('circle')
                .attr('cx', function(d) { return map.latLngToLayerPoint([venues[d.value.v].lat, venues[d.value.v].lng]).x; })
                .attr('cy', function(d) { return map.latLngToLayerPoint([venues[d.value.v].lat, venues[d.value.v].lng]).y; })
                .attr('class', function(d) { return categoryToClass(shows[d.value.sid].category); })
                .attr('r', radius);
                //.attr('opacity', 0)
                //.transition()
                //.attr('opacity', 1);


            dots.data(circles, function(d) { return d.key; })
                .exit()
                .transition()
                .duration(10000/21600)
                .attr('opacity', 0)
                .remove();
        }


        var events = this.performances.slice(100);
        var currentTime = getTime(events[0].time);

        var interval = setInterval(function() {
            if (new Date(currentTime).getMinutes() === 0) {
                $('#time').text(dateTimeString(currentTime) + ' :: ' + Object.keys(circles).length);
                //console.log('there are ' + Object.keys(self.circles).length + ' events on at the moment');
            }

            //if (currentTime>e) {
            if (events.length===0) {
                // check if any circles left
                clearInterval(interval);
                return;
            }
            if(currentTime===getTime(events[0].time)) {
                //console.log('there are ' + events.length + ' events left...');
                event = events.shift();
                //addDots(event['events']['start']);
                //removeDots(event['events']['end']);
                event['events']['start'].forEach(function(e) {
                    circles[e.uid] = e;
                });
                event['events']['end'].forEach(function(e) {
                    delete circles[e.uid];
                });
                updateMap(d3.entries(circles));
            }
            //console.log(currentTime, getTime(events[0].time));
            currentTime = addMinutes(currentTime, 1);

        }, 1/21600);
        this.interval = interval;
    },

    addCircle: function(venue, show, uid) {
        var map = this.map;
        var circle_options = {
            stroke: false,
            color: '#dcdcdc',      // Stroke color
            weight: 0.1,
            opacity: 1,         // Stroke opacity
            weight: 10,         // Stroke weight
            fillColor: '#000',  // Fill color
            fillOpacity: 0.8,    // Fill opacity
            className: categoryToClass(show.category)
        };
        var featureGroup = L.featureGroup().addTo(map);
        this.circles[uid] = featureGroup;
        var coordinates = [venue.lat, venue.lng];
        var radius = 60;
        var circle = L.circle(coordinates, radius, circle_options).addTo(featureGroup);
        circle.bindPopup(show.name + '<br>' + venue.name);
    },

    removeEvent: function(event) {
        var uid = event.uid;
        var circles = this.circles;

        if (circles.hasOwnProperty(uid)) {
            var circle = this.circles[uid];
            this.map.removeLayer(circle);
            delete circles[uid];
        }
    },

    addEvent: function(event) {
        var venue = this.venues[event.v];
        var show = this.shows[event.sid];
        var uid = event.uid;
        this.addCircle(venue, show, uid);
    },

    animate111: function() {
        var s = this.startTime;
        var e = this.endTime;
        var events = this.performances.slice(100);
        var self = this;
        var add = this.addEvent;
        var remove = this.removeEvent;

        //var currentTime = s;
        var currentTime = getTime(events[0].time);
        var interval = setInterval(function() {
            if (new Date(currentTime).getMinutes() === 0) {
                $('#time').text(dateTimeString(currentTime));
                console.log('there are ' + Object.keys(self.circles).length + ' events on at the moment');
            }

            //if (currentTime>e) {
            if (events.length===0) {
                // check if any circles left
                clearInterval(interval);
                return;
            }
            if(currentTime===getTime(events[0].time)) {
                //console.log('there are ' + events.length + ' events left...');
                event = events.shift();
                event['events']['start'].forEach(add, self);
                event['events']['end'].forEach(remove, self);
            }
            //console.log(currentTime, getTime(events[0].time));
            currentTime = addMinutes(currentTime, 1);
        }, 1/21600);
        this.interval = interval;
    },

    stop: function() {
        clearInterval(this.interval);
    },

    eventsAnimation: function(events) {
        events = events.slice(0,100);
        var self = this;
        var add = this.addEvent;
        var remove = this.removeEvent;

        var i = 0;

        setInterval(function() {
            events[i]['events']['start'].forEach(add, self);
            events[i]['events']['end'].forEach(remove, self);
            i++;
        }, 1000);
    }


}


function disableInteractivity(map) {
    //Disable drag and zoom handlers.
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();

    // Disable tap handler, if present.
    if (map.tap) map.tap.disable();
}

function categoryToClass(category) {
    return category.toLowerCase().split(' ').join('').replace(',', '').replace('\'', '');
}

Fringe.init();

function ss(time){}
function getTime(time) {
    return Date.parse(time);
}
function addMinutes(date, minutes) {
    return new Date(date + minutes*60000).getTime();
}
function dateTime(time) {
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "July", "August", "Sep", "Oct", "Nov", "Dec"];
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var time = new Date(time);
    var day = days[time.getDay()];
    var date = time.getDate();
    var month = months[time.getMonth()];
    var hours = time.getHours();
    var minutes = time.getMinutes();
    var suffix = (hours>=12) ? 'pm' : 'am';
    hours = (hours>12) ? (hours-12) : hours;
    //return day + ', ' + month + ' ' + date + ' - ' + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2);
    return {'date': day + ', ' + month + ' ' + date + ordinal(date), 'time': hours + ':' + ('0' + minutes).slice(-2) + suffix};
}

function ordinal(date) {
    if(date > 20 || date < 10) {
        switch(date%10) {
            case 1:
                return "st";
            case 2:
                return "nd";
            case 3:
                return "rd";
        }
    }
    return "th";
}
