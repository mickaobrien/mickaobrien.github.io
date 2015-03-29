var SS;
(function() {
    var schoolData;

    createTypeahead();   

    function processData(data) {
        schoolData = addCounts(data);
        SS = schoolData;
        return createLookup(data);
    }

    function addCounts(data) {
        var districts = Object.keys(data);
        $.map(districts, function(district) {
            var schools = data[district].schools;
            //TODO 3 maps?!
            var numIrish = $.map(schools, function(school) { return school.irish; })
                            .reduce(function(a, b) {
                                return a + b;
                            });
            var numNonIrish = $.map(schools, function(school) { return school['non-irish']; })
                               .reduce(function(a, b) {
                                   return a + b;
                               });

            $.map(schools, function(school) {
                school['propNonIrish'] = school['non-irish']/(school['non-irish'] + school.irish);
            });
            var total = numIrish + numNonIrish;

            data[district]['numIrish'] = numIrish;
            data[district]['numNonIrish'] = numNonIrish;
            data[district]['total'] = total;
        });
        return data;
    }

    function createLookup(data) {
        var keys = Object.keys(data);
        var lookup = $.map(keys, function(key) {
            var schools = data[key].schools;
            return $.map(schools, function(school) { 
                var name = school['name'];
                return {'district': key, 'name': name};
            });
        });
        return lookup;
    }

    function createTypeahead() {
        var schools = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 10,
            prefetch: {
                ttl: 1,
                url: 'data/schools_data.json',
                filter: processData
            }
        });

        // Initialize the Bloodhound suggestion engine
        schools.initialize();

        // Instantiate the Typeahead UI
        $('.typeahead').typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        },
        {
            displayKey: 'name',
            source: schools.ttAdapter()
        });
    }

    function createDescription(district, nameAddress) {
        var data = schoolData[district];
        var name = getSchoolName(nameAddress);
        var districtName = data.name;
        var schools = data.schools;
        var numSchools = schools.length;
        var numIrish = data.numIrish;
        var numNonIrish = data.numNonIrish;
        var total = data.total;
        var pNonIrish = formatPercentage(numNonIrish/total);
        var score = data.score;
        var rank = data.rank;
        var output;

        if (score===0) {
            if (numSchools===1) {
                output = ['<span class="data">', name, '</span> is the only school in the <span class="data">', districtName, '</span> area and so it has a segregation score of <span class="data">0</span>.'].join('');
            } else {
                output = ['There are no non-Irish students registered in the <span class="data">', districtName, '</span> area and so it has a segregation score of <span class="data">0</span>.'].join('');
            }
        } else {
            output = ['<p>','<span class="data">', name, '</span>',
                ' is one of <span class="data">', numSchools, 
                '</span> schools in the <span class="data">', districtName, '</span> area. ',
                'The region has the <span class="data">', formatRank(data.rank), '</span> highest segregation score out of the 562 regions in the country.','</p>',
                '<p>','There are <span class="data">', total.toLocaleString(), '</span> students in the region, of which ', numNonIrish.toLocaleString(), ' (<span class="data">', pNonIrish,
                '</span>) are registered as non-Irish.','</p>',
                '<p>', '<span class="explanation">The dashed line is the region-level percentage of non-Irish students.</span>', '<p>'].join('');
        }

        return ['<div class="description"><p>', output, '</p>',
                '<h4 class="table-title">Breakdown By School</h4>',
                '</div>'].join('');
    }

    function formatRank(rank) {
        if (rank===1) {
            return '';
        }
        return nth(rank);
    }

    function nth(number) {
        var ords = [,'st','nd','rd'];
        var ord, m = number%100;
        return number + ((m > 10 && m < 14)? 'th' : ords[m%10] || 'th');
    }

    function getSchoolName(nameAddress) {
        return nameAddress.split(',')[0];
    }

    function formatScore(score) {
        return score.toPrecision(2);
    }

    function formatPercentage(ratio) {
        return Math.round(100*ratio) + '%';
    }

    function createTable(district) {
        var districtNonIrish = district.numNonIrish/district.total;

        var schoolsData = schoolData[district]
        var schools = schoolsData.schools;
        var districtNonIrish = schoolsData.numNonIrish/schoolsData.total;

        // Sort by proportion of non-Irish
        schools.sort(function(a,b) { 
            return b.propNonIrish - a.propNonIrish; 
        })

        var tbl = ['<thead><tr>',
                   '<th>School Name</th>',
                   '<th>Students</th>',
                   '<th>% Non-Irish</th>',
                   '</tr></thead>'];

        for(var i=0; i<schools.length; i++) {
            var school = schools[i];
            var numIrish = school.irish;
            var numNonIrish = school['non-irish'];
            var total = numIrish + numNonIrish;
            var propNonIrish = numNonIrish/total;
            var percNonIrish = formatPercentage(numNonIrish/total);

            var diff = propNonIrish - districtNonIrish;
            var left = (diff>0) ? '50%' : formatPercentage(0.5 + diff);
            //var color;
            //color = 'hsl(0, ' + formatPercentage(Math.abs(diff)*2) + ', 50%)';
            //if (diff>0) {
                //color = 'hsl(240, ' + formatPercentage(diff) + ', 50%)';
            //} else {
                //color = 'hsl(120, ' + formatPercentage(-diff) + ', 50%)';
            //}

            tbl = tbl.concat(['<tr>',
                              '<td>', getSchoolName(school.name), '</td>',
                              '<td data-title="Students">', total, '</td>',
                              '<td data-title="% Non-Irish">', percNonIrish, '</td>',
                              '<td class="bar-cell">', 
                                '<span class="bar" style="width: ', propNonIrish*100, '%;"></span>',
                                '<span class="line" style="left: ', (-diff)*100, '%;"></span>',
                              '</td>',
                              '</tr>'
                              ]);
        }
        return '<table>' + tbl.join('') + '</table>';
    }

    $(document).ready(function() {

        $('.typeahead').on('typeahead:selected typeahead:autocompleted', function(event, datum) {
                var district = datum.district;
                var schoolName = datum.name;

                var description = createDescription(district, schoolName);
                var table = createTable(district);

                $('#results').html(description + table);
            }
        );
    });
})();
