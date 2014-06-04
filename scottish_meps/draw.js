var margin = {top: 20, right: 100, bottom: 30, left: 250};
var width = 1080 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;

queue()
    .defer(d3.json, 'local_authorities.topo.json')
    .defer(d3.json, 'votes_by_party.json')
    .await(createVis);

var dt;

//d3.json('local_authorities.topo.json', function(data) {
function createVis(error, areas, votes) {

    dt = votes;


    // find min and max of vote percentage
    var vts = votes.map(function(d){return d.votes;});
    var values = vts.map(vals);
    var min = d3.min(values, function(d) {
        return d3.min(d);
    });
    var max = d3.max(values, function(d) {
        return d3.max(d);
    });

    //var opacity = d3.scale.linear()
                    //.domain([min, max])
                    //.range([0.1, 1]);
    var color = d3.scale.quantize()
                  .domain([0, max])
                  .range([0,1,2,3,4,5,6,7,8]);

    function vals(obj) {
        var v = [];
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                v.push(obj[key]);
            }
        }
        return v;
    }



    var svg = d3.select('#map').append('svg')
                .attr('width', width)
                .attr('height', height);

    var g = svg.append('g');
    var projection = d3.geo.albers()
                        .center([11, 55.0])
                        .rotate([4.4, 0])
                        .parallels([55, 60])
                        .scale(2500)
                        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
                    .projection(projection);

    votes.sort(function(a,b) { return a.total < b.total; });
    votes.forEach(function(v) {
        var party = v['party'];
        var votes = v['votes'];
        var seats = v['seats'];
        var total = v['total'];

        var minVotes = 1;
        var maxVotes = -1;
        var minV, maxV;

        for (key in votes) {
            if (votes.hasOwnProperty(key)) {
                if (votes[key] < minVotes) {
                    minVotes = votes[key];
                    minV = [key, votes[key]];
                }
                if (votes[key] > maxVotes) {
                    maxVotes = votes[key];
                    maxV = [key, votes[key]];
                }
            }
        }
        //var values = Object.keys(votes).map(function(key) { return votes[key]; });
        //var minVote = d3.min(values);
        //var maxVote = d3.max(values);

        var html = '<div class="party-heading">' + party + '</div>'
                    + '<div class="party-heading ' + party.replace(' ', '')  + ' line-div"></div>'
                    + 'Won ' + seats + ' seats with ' + +(total*100).toFixed(2) + '% of the vote.'
                    + '<br>'
                    + '&nbsp;'
                    + '<br>'
                    + 'Most popular in <strong>' + maxV[0] + '</strong> with <strong>' + +(maxV[1]*100).toFixed(2) + '%</strong> of the vote.'
                    + '<br>'
                    + '&nbsp;'
                    + '<br>'
                    + 'Least popular in <strong>' + minV[0] + '</strong> with <strong>' + +(minV[1]*100).toFixed(2) + '%</strong> of the vote.'

        var div = d3.select('#party-maps')
                    .append('div')
                    .attr('class', 'party-details')
                    .attr('id', party);
        div.append('p')
            .attr('class', 'vote-details')
            .html(html);
            //.style('width', '10px');

        var svg = div.append('svg')
                    .style('width', '50%')
                    .style('float', 'left')
                    .attr('height', 400);

        var g = svg.append('g');


        g.selectAll('path')
            .data(topojson.feature(areas, areas.objects.test).features)
            .enter()
            .append('path')
            .attr('d', path)
            //.style('opacity', function(d) { return opacity(votes[d.id]); })
            .attr('class', function(d) { return 'area q' + color(votes[d.id]) + '-9'; })
            //.attr('fill', 'black')
            //.attr('class', 'area')
            //.attr('name', function(d) { return d.id; })
            .on('click', function(d) { console.log(party, d.id, votes[d.id]*100); });

    });

    redraw = function(idx) {
        console.log(votes[idx]['party']);
        d3.selectAll('path')
           .style('opacity', function(d) { return opacity(votes[idx]['votes'][d.id]); });
    }
};

var redraw;

///////////////////////////////////////// 
// OLD STUFF
///////////////////////////////////////// 

//function toTitleCase(str)
//{
    //return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
//}


//var y = d3.scale.ordinal()
          //.rangeRoundBands([0, height], .1);

//var x = d3.scale.linear()
          //.domain([0, 1])
          //.range([0, width]);
          //.range([0, height]);

//var xAxis = d3.svg.axis()
            //.scale(x)
            //.orient("bottom")
            //.tickFormat(d3.format(".0%"));

//var yAxis = d3.svg.axis()
            //.scale(y)
            //.orient("left");

//var svg = d3.select("#chart").append("svg")
            //.attr("width", width + margin.left + margin.right)
            //.attr("height", height + margin.top + margin.bottom)
          //.append("g")
            //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//var pub_data;

//d3.json('vote_proportions.json', function(data) {

    //pub_data = data;

     ////Caculate stacked bar positions
    //data.forEach(function(d) {
        //d.votes.sort(function(a, b) { return a.party < b.party; });
        //d.place = toTitleCase(d.place);
        //var y0 = 0;
        //d.votes.forEach(function(v) {
            //v.place = d.place;
            //v.y0 = y0;
            //y0 += v.count;
        //});
    //});

    //y.domain(data.map(function(d) {return d.place;}));

    //svg.append("g")
      //.attr("class", "x axis")
      //.attr("transform", "translate(0," + height + ")")
      //.call(xAxis);

    //svg.append("g")
      //.attr("class", "y axis")
      //.call(yAxis);

    //var place = svg.selectAll('.place')
                   //.data(data)
                   //.enter()
                   //.append('g')
                   //.attr('class', 'place') 
                   //.attr('transform', function(d) { 
                       //return 'translate(0, ' + y(d.place) + ')';
                   //});

    //place.selectAll('rect')
         //.data(function(d) { return d.votes; })
         //.enter()
         //.append('rect')
         //.attr('height', y.rangeBand())
         //.attr('x', function(d) { return x(d.y0); })
         //.attr('width', function(d) { 
             //return x(d.count); 
         //})
         //.attr('class', function(d) { return d.party.replace(' ', ''); })
         //.on('click', function(d) { console.log(d.party + ' got ' + d.count*100 + '% in ' + d.place);});
//});
