const mongoose = require("mongoose");

const ActionSchema = new mongoose.Schema({
  // This is used for logging purposes.
  performedAt: Date,
  op: String,
  args: String, // Use JSON.stringify() to set this
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const RockPaperScissorsGameSchema = new mongoose.Schema({
  // progressState stores a code corresponding to the game object's high-level state
  progressState: String,

  // Section 1: Properties first needed for state AWAITING_HOST
  title: String,
  createdAt: Date,
  updatedAt: Date,
  players: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
  },
  actionLog: {
    type: [ActionSchema],
  },

  // Section 2: Properties first needed for state AWAITING_GAME
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  settings: {
    pointsObjective: Number,
  },
  isReady: [Boolean],

  // Section 3: Properties first needed for state PLAYING_GAME
  currentRound: Number,
  signsThrown: [[String]], // e.g. signsThrown[1][0] is Player 1's sign in Round 2
  scores: [Number],

  // Section 4: Properties first needed for state CONCLUDED
  concludedAt: Date,
  conclusionType: String, // "normal" or "by-resignation"
  playerResults: {
    type: [{
      outcome: String, // "won", "lost", or "resigned"
      finalScore: Number,
    }],
  },

});

const RockPaperScissorsGame = mongoose.model(
  "RockPaperScissorsGame", RockPaperScissorsGameSchema
);

module.exports = RockPaperScissorsGame;
