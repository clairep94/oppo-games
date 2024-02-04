module.exports = {
  gameTitle: "Battleships",
  gameEndpoint: "battleships",
  submitEndpoint: "submit_placements",
  resetEndpoint: "reset_placements",

  // BOARDS
  emptyBoard: [
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
  ],

  submittedPlacementsBoard: [
    ["", "", "S", "", "", "", "", "", "", ""],
    ["", "", "S", "", "", "", "", "B", "", ""],
    ["", "", "S", "", "", "", "", "B", "", ""],
    ["", "", "", "", "", "", "", "B", "", ""],
    ["", "", "", "", "", "", "", "B", "", ""],
    ["", "C", "C", "C", "C", "C", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "D", "", "", "", "R", "R", "R", ""],
    ["", "", "D", "", "", "", "", "", "", ""],
  ],

  incompletePlacementsBoard: [
    ["", "", "S", "", "", "", "", "", "", ""],
    ["", "", "S", "", "", "", "", "B", "", ""],
    ["", "", "S", "", "", "", "", "B", "", ""],
    ["", "", "", "", "", "", "", "B", "", ""],
    ["", "", "", "", "", "", "", "B", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "D", "", "", "", "R", "R", "R", ""],
    ["", "", "D", "", "", "", "", "", "", ""],
  ],

  concealedBoard: emptyBoard,

  unconcealedBoard: [
    ["", "", "s", "", "", "", "", "", "", ""],
    ["", "", "s", "", "", "", "", "s", "", ""],
    ["", "", "s", "", "", "", "", "s", "", ""],
    ["", "", "", "", "", "", "", "s", "", ""],
    ["", "", "", "", "", "", "", "s", "", ""],
    ["", "s", "s", "s", "s", "s", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "s", "", "", "", "s", "s", "s", ""],
    ["", "", "s", "", "", "", "", "", "", ""],
  ],

  // SHIPYARDS
  unplacedShips: {
    carrier: { sank_status: false, units: [] },
    battleship: { sank_status: false, units: [] },
    cruiser: { sank_status: false, units: [] },
    submarine: { sank_status: false, units: [] },
    destroyer: { sank_status: false, units: [] },
  },

  unconcealedShips: {
    carrier: {
      sank_status: false,
      units: [
        { hit_status: false, units: [5, 1] },
        { hit_status: false, units: [5, 2] },
        { hit_status: false, units: [5, 3] },
        { hit_status: false, units: [5, 4] },
        { hit_status: false, units: [5, 5] },
      ],
    },
    battleship: {
      sank_status: false,
      units: [
        { hit_status: false, units: [1, 7] },
        { hit_status: false, units: [2, 7] },
        { hit_status: false, units: [3, 7] },
        { hit_status: false, units: [4, 7] },
      ],
    },
    cruiser: {
      sank_status: false,
      units: [
        { hit_status: false, units: [8, 6] },
        { hit_status: false, units: [8, 7] },
        { hit_status: false, units: [8, 8] },
      ],
    },
    submarine: {
      sank_status: false,
      units: [
        { hit_status: false, units: [0, 2] },
        { hit_status: false, units: [1, 2] },
        { hit_status: false, units: [2, 2] },
      ],
    },
    destroyer: {
      sank_status: false,
      units: [
        { hit_status: false, units: [8, 2] },
        { hit_status: false, units: [9, 2] },
      ],
    },
  },

  concealedShips: {
    carrier: { sank_status: false },
    battleship: { sank_status: false },
    cruiser: { sank_status: false },
    submarine: { sank_status: false },
    destroyer: { sank_status: false },
  },
};
