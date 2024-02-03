const app = require("../../../app");
const request = require("supertest");
require("../../mongodb_helper");
const Battleships = require("../../../models/battleships");
const User = require("../../../models/user");
const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

const {
  expectedGameObject,
  expectErrorMessage,
  expectNewToken,
  expectResponseBody,
  expectResponseCode,
  expectNoGameObject,
  expectNoToken,
  expectError,
} = require("../../utils/TestHelpers");

// =============== DECLARE VARIABLES ===============

const gameTitle = "Battleships";
const gameEndpoint = "battleships";
const putEndpoint = "launch_missile";

// BOARDS
const initialBoard = [
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
];

const initialConcealedBoard = [
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
];

// SHIPYARDS
const initialShips = {
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
};

const initialConcealedShips = {
  carrier: { sank_status: false },
  battleship: { sank_status: false },
  cruiser: { sank_status: false },
  submarine: { sank_status: false },
  destroyer: { sank_status: false },
};

let token;
let user1;
let user2;
let user3;
let game;
let response;

// ==================== LAUNCH MISSILE ===========================
// TODO add winner getting points for the two win conditions.

describe(".LAUNCHMISSILE - /battleships/:gameID/launch_missile", () => {
  // ---------------- ARRANGE: DB cleanup, create Users & token -------------
  beforeAll(async () => {
    // create 3 users. user1 is our sessionUser
    user1 = new User({
      email: "user1@test.com",
      username: "first_user123",
      password: "12345678",
    });
    await user1.save();
    user2 = new User({
      email: "user2@test.com",
      username: "second_user123",
      password: "12345678",
    });
    await user2.save();
    user3 = new User({
      email: "user3@test.com",
      username: "third_user123",
      password: "12345678",
    });
    await user3.save();

    // generate token, logged in with user1;
    token = JWT.sign(
      {
        user_id: user1.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );
  });

  // reset database;
  beforeEach(async () => {
    await Battleships.deleteMany({});
  });
  afterAll(async () => {
    await User.deleteMany({});
    await Battleships.deleteMany({});
  });

  // -------------- LAUNCH MISSILE WITH TOKEN & NO ERRORS -- HIT -------------------
  describe("When a token is present and no errors", () => {
    const row = 2;
    const col = 2;

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
      });
      await game.save();

      // get the id of the game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ row: row, col: col });
    });

    // --------- ASSERT: Response code 200, returns a token & populated game with appropriate concealment -----------
    test("responds with a 200", async () => {
      await expectResponseCode(response, 200);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("returns a battleships object with a populated playerOne, and concealed playerTwoBoard & playerTwoShips", () => {
      const expectedResponse = expectedGameObject(
        "first_user123",
        "second_user123",
        gameTitle,
        gameEndpoint,
        {
          playerOneShips: initialShips,
          playerTwoShips: initialConcealedShips,
          playerOneBoard: initialBoard,
          playerTwoBoard: initialConcealedShips,
        }
      );
      expect(response.body.game).toMatchObject(expectedResponse);
    });
  });
});
// token & no errors
// no token
// out of turn -- not in game & not your turn
// space already checked
// game already over

// =================== CHECK WIN ==============================
// token & no errors
// no token

// =================== GAMEPLAY TO WIN ===========================
