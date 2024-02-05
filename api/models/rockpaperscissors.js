const mongoose = require("mongoose");

const RockPaperScissorsSchema = new mongoose.Schema(
  {
    // ----------- Title & Endpoint -- necessary for mapping over gamesList ------------
    title: {
      type: String,
      default: "RockPaperScissors",
    },
    endpoint: {
      // don't include the '/'
      type: String,
      default: "rockpaperscissors",
    },

    // ----------- Players & Open Game Properties ------------
    playerOne: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Games must have a host"],
    },
    playerTwo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ----------- Active Game Properties ------------
    // turn: {
    //   // after a player moves, turn ++; if turn === 9: draw.
    //   // whoseTurn = (turn % 2 === 0) ? players[0] : players[1]
    //   type: Number,
    //   default: 0,
    // },

    // ----------- Finished Game Properities ------------
    winner: {
      // if [], no winner yet, if winner.length === 1, find winner._ID, if winner.length === 2: draw
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "User",
    },
    finished: {
      type: Boolean,
      default: false,
    },

    // =========== PROPERTIES SPECIFIC TO ROCK PAPER SCISSORS ==================

    currentRound: {
      type: Number,
      default: 0, // when second player joins, set currentRound to 1.
    },
    maxRounds: {
      type: Number,
      default: 3, // if rounds.length <= maxRounds, keep playing.
    },
    rounds: [
      {
        playerOneChoice: { type: String }, // "R", "P", "S"
        playerTwoChoice: { type: String }, // "R", "P", "S"
        outcome: { type: String }, // playerOne, playerTwo or draw
      },
    ],
    // To determine the winner, at the end of maxRounds (for round in rounds, round.outcome is truthy)
    // Count the number of playerOne vs playerTwo wins --> find winner or draw.
  },
  {
    timestamps: true, // this creates createdAt and updatedAt properties that are auto-updated
  }
);

const RockPaperScissors = mongoose.model(
  "RockPaperScissors",
  RockPaperScissorsSchema
);

module.exports = RockPaperScissors;
