// Define the formatting for labels and values based of JSON keys
var NUMCARDS = 10;
var LOSER = {"player": "computer", "computer": "player"},
    ANIMATIONS = {
        "player": {
            "player": {marginLeft: "-50%", marginRight: "50%", opacity: 0},
            "computer": {marginLeft: "-150%", marginRight: "150%", opacity: 0}
        },
        "computer": {
            "player": {marginLeft: "150%", marginRight: "-150%", opacity: 0},
            "computer": {marginLeft: "50%", marginRight: "-50%", opacity: 0}
        },
        "draw": {
            "player": {marginLeft: "25%", marginRight: "-25%", opacity: 0},
            "computer": {marginLeft: "-25%", marginRight: "25%", opacity: 0}
        }
    };

var cards = shuffle(superheroes);
var deal = dealCards(cards);
var TopTrumps = Ractive.extend({
    el: "container",
    template: "#template",
    debug: true,

    init: function() {
        this.set('cards', dealCards(superheroes));
        this.set('cards.draw', []);
        preload($.map(this.get('cards.player'), function(c){return c.img}));
        //var self = this;
        //$.getJSON('superheroes.json', function(data) {
        //});
    },
    reset: function() {
        this.set('selected', -1);
        $('.card').css({margin: 0, opacity: 1})
    },
    //modifyArrays: false
});

var ractive = new TopTrumps({
        data: {
            selected: '',
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
    select: function(e, key) {
        this.set('selected', key);
        $('.card-back').hide();
        var winner = compare(key);
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
            return p.img;
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
    var playerCards = cards.slice(0, NUMCARDS);
    var computerCards = cards.slice(NUMCARDS, 2*NUMCARDS);

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

function compare(key) {
    var playerAttributes = ractive.get('cards.player.0.attributes');
    var playerValue = playerAttributes[key];
    var computerAttributes = ractive.get('cards.computer.0.attributes');
    var computerValue = computerAttributes[key];
    var winner;

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
}

function shuffle(cards) {
    return cards.sort(function() { return 0.5  - Math.random() });
}
