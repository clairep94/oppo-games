const mongoose = require("mongoose");

const BattleshipsSchema = new mongoose.Schema(
  {
    // ----------- Title & Endpoint -- necessary for mapping over gamesList ------------
    title: {
      type: String,
      default: "Battleships",
    },
    endpoint: {
      // don't include the '/'
      type: String,
      default: "battleships",
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
    turn: {
      // after a player moves, turn ++; if turn === 9: draw.
      // whoseTurn = (turn % 2 === 0) ? players[0] : players[1]
      type: Number,
      default: 0,
    },

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

    // =========== PROPERTIES SPECIFIC TO BATTLESHIPS ==================

    // ----------- SHIPS -----------------
    // Storing player one's ships
    // Units are stored as {hit_status: Bool, coordinate: [Number, Number]} and are added in the SubmitShipPlacements method.
    // See controllers/battleships line 204.
    playerOneShips: {
      type: Object,
      of: {
        sank_status: { type: Boolean, default: false },
        units: [
          {
            hit_status: { type: Boolean, default: null },
            coordinate: [Number, Number],
          },
        ],
      },
      default: {
        // units as hit status & coordinates: [Number, Number] get added in the BattleshipsController.SubmitShipPlacements method. See controllers/battleships line 250
        carrier: { sank_status: false, units: [] }, // 5 units
        battleship: { sank_status: false, units: [] }, // 4 units
        cruiser: { sank_status: false, units: [] }, // 3 units
        submarine: { sank_status: false, units: [] }, // 3 units
        destroyer: { sank_status: false, units: [] }, // 2 units
      },
    },
    playerTwoShips: {
      type: Object,
      of: {
        sank_status: { type: Boolean, default: false },
        units: [
          {
            hit_status: { type: Boolean, default: null },
            coordinate: [Number, Number],
          },
        ],
      },
      default: {
        carrier: { sank_status: false, units: [] },
        battleship: { sank_status: false, units: [] },
        cruiser: { sank_status: false, units: [] },
        submarine: { sank_status: false, units: [] },
        destroyer: { sank_status: false, units: [] },
      },
      // default: new Map(Object.entries({
      //     carrier: { sank_status: false, units: Array.from({ length: 5 }, () => ({ hit_status: null, coordinate: [null, null] })) },
      //     battleship: { sank_status: false, units: Array.from({ length: 4 }, () => ({ hit_status: null, coordinate: [null, null] })) },
      //     cruiser: { sank_status: false, units: Array.from({ length: 3 }, () => ({ hit_status: null, coordinate: [null, null] })) },
      //     submarine: { sank_status: false, units: Array.from({ length: 3 }, () => ({ hit_status: null, coordinate: [null, null] })) },
      //     destroyer: { sank_status: false, units: Array.from({ length: 2 }, () => ({ hit_status: null, coordinate: [null, null] })) }
      // }))
    },

    // ----------- BOARDS -----------------
    // 10x10 boards
    // Each cell of the game board is represented as a string
    // "": Empty space (no ship)
    // "s": Ship present
    // "X": Hit (ship present at this location)
    // "O": Miss (no ship at this location)
    // "S": Sank (full ship sank)
    // For accessing the rows, the letter "A", "B", etc. will be converted to an index
    // For accessing the cols, the number "1", "2", etc. will be converted to an index
    // For the FindByID method:
    // If the viewer is NOT the owner of the board (ie. a spectator or the opponent), they will get a hashed version of the board
    // This concealed version checks for "s" and converts it to "".
    // This concealment occurs in the backend before the final game data is returned, rather than in the frontend display methods, so that players cannot cheat by inspecting the data.
    playerOneBoard: {
      type: [[String]],
      default: Array.from({ length: 10 }, () =>
        Array.from({ length: 10 }, () => "")
      ),
    },
    playerTwoBoard: {
      type: [[String]],
      default: Array.from({ length: 10 }, () =>
        Array.from({ length: 10 }, () => "")
      ),
    },
  },

  {
    timestamps: true, // this creates createdAt and updatedAt properties that are auto-updated
  }
);

const Battleships = mongoose.model("Battleships", BattleshipsSchema);

module.exports = Battleships;
