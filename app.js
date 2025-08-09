const { createApp } = Vue;

createApp({
    data() {
        return {
            suits: ["♠", "♥", "♦", "♣"],
            ranks: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"],
            players: [
                { name: "Player 1", cards: [], bet: null, balance: 1000 },
                { name: "Player 2", cards: [], bet: null, balance: 1000 },
                { name: "Player 3", cards: [], bet: null, balance: 1000 }
            ],
            winner: null
        };
    },
    methods: {
        getDeck() {
            let deck = [];
            for (let suit of this.suits) {
                for (let rank of this.ranks) {
                    deck.push({ rank, suit });
                }
            }
            return deck;
        },
        shuffle(deck) {
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            return deck;
        },
        dealCards() {
            let deck = this.shuffle(this.getDeck());
            for (let i = 0; i < this.players.length; i++) {
                this.players[i].cards = deck.splice(0, 3);
            }
            this.winner = null;
        },
        handValue(cards) {
            let values = cards.map(c => this.ranks.indexOf(c.rank));
            return values.reduce((a, b) => a + b, 0);
        },
        determineWinner() {
            let maxVal = -1;
            let winIndex = -1;
            for (let i = 0; i < this.players.length; i++) {
                let val = this.handValue(this.players[i].cards);
                if (val > maxVal) {
                    maxVal = val;
                    winIndex = i;
                }
            }
            if (winIndex !== -1) {
                this.winner = this.players[winIndex].name;
            }
        }
    }
}).mount("#app");
