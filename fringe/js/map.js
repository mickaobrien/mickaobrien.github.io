(function(){
    var Fringe = {

        init: function() {
            L.mapbox.accessToken = 'pk.eyJ1IjoiLW1pY2stIiwiYSI6InBoM0pvdXMifQ.cZxAMQ7D-nENcB5SPagqpg';
            this.drawMap();

            //Load venue and show data in the background
            $.when(this.loadStaticData())
             .then(function() { 
                 var b = $('button');
                 b.text('Show Me A Day');
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
            this.disableInteractivity(map);
            //var stamenLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
                  //attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
            //}).addTo(map);
            var customLayer = L.mapbox.tileLayer('-mick-.j15dkof3', {
                  attribution: 'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
            }).addTo(map);

            this.map = map;
        },

        disableInteractivity: function(map) {
            //Disable drag and zoom handlers.
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();

            // Disable tap handler, if present.
            if (map.tap) map.tap.disable();
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
                   //self.date = Time.dateTime(Time.getTime(data.performances[0]['time'])).date;
                   self.date = Time.getDate(data.performances[0]['time']);
                   deferred.resolve();
                   self.animate.call(self);
            });
            return deferred;
        },

        setDayInfo: function() {
            var count = this.count;
            var busy = this.busy;
            var date = this.date;

            //$('#date').text(date);
            $('#date').html(date.day + ', <span id="month-date">' + [date.month, date.date].join(' ') + '</span>' );
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

            var currentTime = Time.getTime(events[0].time);

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
                        $(this).attr('disabled', 'disabled');
                        $(this).text('Loading...');
                        $.when(self.loadDayData())
                         .then(function() {
                             $('#show-info').text('Click a show to get more info');
                         });
                    });
                    return;
                }


                if(currentTime===Time.getTime(events[0].time)) {
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
                currentTime = Time.addMinutes(currentTime, 1);

            }, 300/6);
            this.interval = interval;
        },

        updateTime: function(time) {
            var time = Time.getTimeString(time);
            $('#current-time').text(time);
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
            
            var self = this;

            dots.data(circles, function(d) { return d.key; })
                .enter()
                .append('circle')
                .attr('cx', function(d) { return map.latLngToLayerPoint([venues[d.value.v].lat, venues[d.value.v].lng]).x; })
                .attr('cy', function(d) { return map.latLngToLayerPoint([venues[d.value.v].lat, venues[d.value.v].lng]).y; })
                .attr('class', function(d) { return self.categoryToClass(shows[d.value.sid].category); })
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

        stop: function() {
            clearInterval(this.interval);
        },

        categoryToClass: function(category) {
            return category.toLowerCase().split(' ').join('').replace(',', '').replace('\'', '');
        }
    }

    var Time = {
        getTime: function(time) {
            return Date.parse(time);
        },

        addMinutes: function(date, minutes) {
            return new Date(date + minutes*60000).getTime();
        },

        getDate: function(time) {
            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "July", "August", "Sep", "Oct", "Nov", "Dec"];
            var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            var time = new Date(time);
            var day = days[time.getDay()];
            var date = time.getDate();
            var month = months[time.getMonth()];
            //return day + ', ' + month + ' ' + date + this.ordinal(date)
            return {'month': month, 'day': day, 'date': date + this.ordinal(date)}
        },

        getTimeString: function(time) {
            var time = new Date(time);
            var hours = time.getHours();
            var minutes = time.getMinutes();
            var suffix = (hours>=12) ? 'pm' : 'am';
            hours = (hours>12) ? (hours-12) : hours;
            return hours + ':' + ('0' + minutes).slice(-2) + suffix;
        },

        ordinal: function(date) {
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
    }

    Fringe.init();
})();
