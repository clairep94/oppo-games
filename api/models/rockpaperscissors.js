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

    turn: {
      // NOTE: Changed back to turn from currentRound, as turns is used in all game types and used in games controller.
      // This property is close to a "round" rather than a "turn" as both players go at once.
      type: Number,
      default: 0,
    },

    // =========== PROPERTIES SPECIFIC TO ROCK PAPER SCISSORS ==================
    maxRounds: {
      type: Number,
      default: 3, // if turn+1 <= maxRounds, keep playing.
    },
    finishedRounds: [
      {
        playerOneChoice: { type: String }, // "R", "P", "S"
        playerTwoChoice: { type: String }, // "R", "P", "S"
        outcome: { type: String }, // playerOne, playerTwo or draw
      },
    ],
    currentRound: {
      playerOneChoice: { type: String, default: null }, // "R", "P", "S"
      playerTwoChoice: { type: String, default: null }, // "R", "P", "S"
      outcome: { type: String, default: null }, // playerOne, playerTwo or draw
    },
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
