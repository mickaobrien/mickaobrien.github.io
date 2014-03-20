// Define the formatting for labels and values based of JSON keys
var FORMATTING = {
    "terms": {"label": "Number of terms",
              "format": function(value) {return value;}},
    "years": {"label": "Years in the Oireachtas",
              "format": function(value) {return value;}},
    "attendance": {"label": "Attendance in 2013",
                   "format": function(value) {return value + " days";}},
    "questions": {"label": "Questions asked on Dailwatch",
                  "format": function(value) {return value;}},
    "percent_answered": {"label": "% of questions answered",
                         "format": function(value) {
                             if (isNaN(value)) {
                                 return "N/A";
                             }
                             return cleanPercent(value) + "%";
                         }},
    "vote_present": {"label": "% of votes present for",
                     "format": function(value) {
                         return cleanPercent(value) + "%";
                     }}
},
    LOSER = {"player": "computer", "computer": "player"},
    CLASSNAMES = {
    "Fine Gael": "fine-gael",
    "Fianna Fáil": "fianna-fail",
    "Labour": "labour",
    "Sinn Féin": "sinn-fein",
    "Independent": "independent",
    "Socialist Party": "socialist",
    "People Before Profit Alliance/United Left Alliance": "pbp-ula" 
},
    ANIMATIONS = {
        "player": {
            "player": {marginLeft: "-50%", opacity: 0},
            "computer": {marginLeft: "-150%", opacity: 0}
        },
        "computer": {
            "player": {marginLeft: "150%", opacity: 0},
            "computer": {marginLeft: "50%", opacity: 0}
        },
        "draw": {
            "player": {marginLeft: "25%", marginTop: "25%", opacity: 0},
            "computer": {marginLeft: "-25%", marginTop: "25%", opacity: 0}
        }
    };

function cleanPercent(perc) {
    return parseFloat(parseFloat(perc).toFixed(2));
}

var politicians;
var c,p;
var TopTrumps = Ractive.extend({
    el: "container",
    template: "#template",

    init: function() {
        var self = this;
        getCards()
        .then(dealCards)
        .then(function(cards){
            self.set('cards', cards);
            self.set('cards.draw', []);
            c = self.get('cards.computer');
            p = self.get('cards.player');
        });
    },
    reset: function() {
        this.set('selected', -1);
        $('.card').css({marginLeft: 0, marginTop: 0, opacity: 1})
    },
    modifyArrays: false
});

var ractive = new TopTrumps({
        data: {
            selected: -1,
            formatValue: function(label, value) {
                return FORMATTING[label].format(value);
            },
            formatLabel: function(label) {
                return FORMATTING[label].label;
            },
            getClassName: function(party) {
                return CLASSNAMES[party];
            }
        },
});

ractive.on({
    select: function(e, count) {
        this.set('selected', count);
        $('.card-back').hide();
        var winner = compare(count);
        var self = this;
        window.setTimeout(function() {
            var animation = ANIMATIONS[winner];
            $('.player>.card').animate(animation.player, 'slow');
            //TODO cache reference or fix up references
            $('.computer>.card').animate(animation.computer, 'slow',
                function() {
                    settleUp(winner);
                    $('.card-back').show();
                    self.reset();
                });
        }, 1500);
    }
});

ractive.observe('cards', function(newValue, oldValue, keyPath) {
    if (newValue.player.length === 0) {
        $("#container").html("<h1>computer wins!</h1>");
    }
    else if (newValue.computer.length === 0) {
        $("#container").html("<h1>player wins!</h1>");
    }
});

function createEventListeners() {
    ractive.on({
        highlight: function(e) {
            $(e.original.target).toggleClass('highlight');
        },
        select: function(e, count) {
            listener.cancel();
            this.set('selected', count);
            var winner = compare(count);
            var self = this;
            window.setTimeout(function() {
                settleUp(winner);
                self.reset();
            }, 2000);
        }
    });
}


function getCards() {
    return $.get('/api/top-trumps', function(politicians) {
        var image_paths = $.map(politicians, function(p) {
            return p.image;
        });
        preload(image_paths);
        politicians.forEach(group_attributes);
    });
};

function preload(images) {
    images.forEach(function(image) {
        $("<img/>")[0].src = image;
    });
};

function dealCards(cards) {
    var numCards = cards.length/2,
        playerCards = cards.splice(0, numCards),
        computerCards = cards;

    return {"player": playerCards, "computer": computerCards};
}

function group_attributes(politician) {
    //Group attributes used on card together in nested object.
    var main = ["uid", "name", "constituency", "party", "image"],
        attributes = [];
    for(var key in politician){
        if ($.inArray(key, main)===-1) {
            var attribute = {};
            attribute.label = key;
            attribute.value = parseFloat(politician[key]);

            attributes.push(attribute);
            delete politician[key];
        }
    }

    politician.attributes = attributes;
    return politician;
}

function compare(count) {
    var playerValue = setNaNToZero(p[0].attributes[count].value),
        computerValue = setNaNToZero(c[0].attributes[count].value),
        winner;

    if (playerValue === computerValue) {
        winner = 'draw';
    }
    else {
        winner = playerValue > computerValue ? 'player' : 'computer';
    }

    return winner;
}

function setNaNToZero(value) {
    // Sets a value to 0 if it's NaN.
    if (isNaN(value)) {
        return 0;
    }
    return value;
}

function settleUp(winner) {
    var loser = LOSER[winner],
        cards = ractive.get('cards'),
        drawCards = cards.draw;

    if (winner==='draw') {
        drawCards.push(cards.player.shift(), cards.computer.shift());
    }
    else {
        var winnersCards = cards[winner],
            losersCards = cards[loser];

        //TODO tidy
        if (drawCards) {
            while (card = drawCards.pop()) {
                winnersCards.push(card);
            }
        }
        winnersCards.push(winnersCards.shift(), losersCards.shift());
    }
    ractive.update('cards');
    console.log($.map([0,1,2,3,4,5],compare));
}
