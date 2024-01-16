const mongoose = require("mongoose");

const ActionSchema = new mongoose.Schema({
  performedAt: Date,
  op: String,
  args: String, // Use JSON.stringify()
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const OceanGridLocationContents = new mongoose.Schema({
  hitStatus: Boolean, // starts false
  occupiedByShip: Boolean,
  // if occupiedByShip, these won't be null:
  indexInFleet: Number,
  locationIndexInShip: Number, // Doesn't change during game turns: include to avoid recalculation
  // WARNING: locationIndexInShip can allow a player to cheat if leaked to the wrong client,
  // so make sure to redact it in that case.
});

const BattleshipsGameSchema = new mongoose.Schema({
  // progressState stores a code corresponding to the game object's high-level state
  progressState: String,

  // randomSeed stores a secret random value (for Battleships, this is only used
  // (after a PREPARE op) if the setting to randomly pick turn order is chosen.)
  randomSeed: Number,

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
    spectationPermitted: Boolean,
    // Spectators (i.e. all non-participants) will see all private info
    // except the random seed.
    turnOrderAssignmentMechanism: String, // Agreed or random both available
    /*salvoVariation: Boolean,*/ // Definitely a stretch goal!!
  },
  isReady: [Boolean],

  // Section 3: Properties first needed for state PLACING_SHIPS
  shipPieces: {
    type: [[{ // 1st index: playerIndex (0 ~ 1), 2nd index: indexInFleet of ship (0 ~ 4)
      shipName: String, // Carrier Battleship Cruiser Submarine Destroyer (resp'ly)
      shipLength: Number, //     5          4       3         3         2
      topLeftCornerLocation: { // This has the lowest (row + col) value
        type: { row: Number, col: Number, }, // Each (0 ~ 9)
      },
      orientation: String,
      // "horizontal"  ==>  ROW stays the SAME      |  COL VARIES low to high
      // "vertical"    ==>  ROW VARIES low to high  |  COL stays the SAME
      sectionHitStatus: [Boolean], // starts all false. when all true, ship has sunk.
      hasSunk: Boolean,
    }]],
  },
  placementComplete: [Boolean],
  oceanGrids: {
    type: [[[OceanGridLocationContents]]],
    // 1st index: playerIndex (0 ~ 1),
    // 2nd index: row (0 ~ 9),
    // 3rd index: col (0 ~ 9)
  },

  // Section 4: Properties first needed for state TAKING_TURNS
  currentRound: Number, // Starts at 0 (THIS IS DIFFERENT FROM RPS)
  currentTurnWithinRound: Number, // (0 ~ 1), starts at 0
  turnOrder: [Number], // assuming 0 is playerIndex of host:
  // [0, 1] for host starting, [1, 0] for non-host starting
  movesTaken: {
    type: [{
      round: Number,
      turn: Number,
      targetedLocation: {
        type: { row: Number, col: Number, }, // Each (0~9)
      },
    }],
  },
  // publicCommunications: {
  //   // Such as opponent announcing name of hit/sunk ship (THIS IS NOT GAME CHAT)
  //   type: [{
  //     speakerIndex: Number, // is a player index
  //     subject: String, // e.g. "you-missed", "you-hit", "you-sunk"
  //     details: String, // Can parse this to json depending on value of `subject`
  //   }],
  // },

  // Section 5: Properties first needed for state CONCLUDED
  concludedAt: Date,
  conclusionType: String, // "normal" or "by-resignation"
  playerResults: {
    type: [{
      outcome: String, // "won", "lost", or "resigned"
      shipsRemaining: Number, // need more than 0 to not lose
    }],
  },

});



const BattleshipsGame = mongoose.model(
  "BattleshipsGame", BattleshipsGameSchema
);

module.exports = BattleshipsGame;
