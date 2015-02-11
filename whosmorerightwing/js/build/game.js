/** @jsx React.DOM */
var Points = React.createClass({displayName: "Points",
    render: function() {
        if (this.props.showingResults) {
            var color = (this.props.answerCorrect) ? 'green' : 'red';
            var style = {backgroundColor: color, color: 'white'};
        }
        return (
            React.createElement("div", {className: "points"}, 
                React.createElement("span", {style: style, className: "ratio"}, "Score:",  
                    React.createElement("span", {className: "ratio"}, this.props.correctGuesses, "/", this.props.questionsAsked)
                )
            )
        );
    }
});
var Share = React.createClass({displayName: "Share",
    twitterURL: function() {
        var text = encodeURIComponent(this.props.tweetText);
        return "https://twitter.com/intent/tweet?url=http://www.whosmorerightwing.com&text=" + text;
    },
    render: function() {
        return (
            React.createElement("a", {href: this.twitterURL(), className: "share"}, "Tweet")
        );
    }
});

var Card = React.createClass({displayName: "Card",
    handleClick: function() {
        //console.log(this.getDOMNode());
        this.props.onCardClicked(this.props.group.title);
    },
    createScoreDiv: function(score, style) {
        return (React.createElement("div", {className: "score", style: style}, 
                    React.createElement("span", {className: "value"}, score, "%"), " right wing"
                ));
    },
    render: function() {
        var score;
        var style;
        if (this.props.showScores) {
            var scoreVal = this.props.group.score;
            var color = 'hsl(240,' + (scoreVal) + '%, 50%)';
            style = {color: color};
            score = this.createScoreDiv(scoreVal, style);
        } else {
            score = this.createScoreDiv('', {visibility: 'hidden'});
        }
        return (
            React.createElement("div", {className: "card", onClick: this.handleClick}, 
                React.createElement("div", {className: "title"}, this.props.group.title), 
                score
            )
        );
    }
});

var Game = React.createClass({displayName: "Game",
    getInitialState: function() {
        return {
            data: [],
            cards: [],
            showingResults: false,
            tweetText: 'Who\'s more right wing?',
            answerCorrect: false,
            correctGuesses: 0,
            questionsAsked: 0
        };
    },
    removeDuplicates: function(cards) {
        return _.uniq(cards, function(card) { return card.score; });
    },
    getData: function() {
        var self = this;
        var NUMBER_FILES = 536;
        var filenumber = Math.floor((Math.random() * NUMBER_FILES));
        var filename = 'data/' + filenumber + '.json';
        return $.getJSON(filename, function(data) {
            var shuffledData = _.shuffle(data);
            var allData = _.union(self.state.data, shuffledData);
            var uniqueData = self.removeDuplicates(allData);
            self.setState({data: uniqueData});
        });
    },
    getTweetText: function() {
        var cards = this.state.cards;
        var group1 = cards[0].title;
        var group2 = cards[1].title;
        var currentText = this.state.tweetText;
        var newText = ['Who\'s more right wing: ', group1, ' or ', group2, '?'].join('');
        if (newText.length<118) {
            this.setState({tweetText: newText});
        }
        return this.state.tweetText;
    },
    deal: function() {
        //TODO assuming data has entries
        //TODO make sure they don't have the same score
        var card1 = this.state.data.pop();
        var card2 = this.state.data.pop();
        this.setState({showingResults: false, cards: [card1, card2], answerCorrect: false});
        this.setState({tweetText: this.getTweetText()});
    },
    componentDidMount: function() {
        this.getData().then(this.deal);
    },
    clickedWinner: function(clickedCardTitle) {
        var cards = this.state.cards;
        var clickedIndex = _.findIndex(cards, {'title': clickedCardTitle});
        var clickedScore = cards[clickedIndex].score;
        var otherScore = cards[1-clickedIndex].score;
        if (clickedScore > otherScore) {
            return true;
        }
        return false;
    },
    handleCardClicked: function(clickedCardTitle) {
        //TODO is there a better way of handling this? i.e. disabling clicks while showing results
        if (this.state.showingResults) {
            return;
        }
        var didWin = this.clickedWinner(clickedCardTitle);
        this.setState({showingResults: true, answerCorrect: didWin});
        if (didWin) {
            this.setState({correctGuesses: this.state.correctGuesses+1})
        }
        this.setState({questionsAsked: this.state.questionsAsked+1})

        window.setTimeout(this.deal, 2250);

        //Get more data if it's running out
        if (this.state.data.length<10) {
            this.getData();
        }
    },
    render: function() {
        var currentCards = this.state.cards;
        var game;
        if (currentCards.length > 0) {
            var cards = currentCards.map(function(card) {
                return(
                    React.createElement(Card, {key: card.title, group: card, showScores: this.state.showingResults, onCardClicked: this.handleCardClicked})
                )
            }, this);
            game = React.createElement("div", {className: "cards"}, 
                     cards
                   );
        } else {
            game = React.createElement("div", null, "Refresh to play again")
        }
        return (
            React.createElement("div", {className: this.state.data.length>0 ? 'stuff' : 'no-stuff'}, 
                game, 
                React.createElement(Points, {correctGuesses: this.state.correctGuesses, questionsAsked: this.state.questionsAsked, answerCorrect: this.state.answerCorrect, showingResults: this.state.showingResults}), 
                React.createElement(Share, {tweetText: this.state.tweetText})
            )
        );
    }
});

React.render(
    React.createElement(Game, null),
    document.getElementById('game')
);
