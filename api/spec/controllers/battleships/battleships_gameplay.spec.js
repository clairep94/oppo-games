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
const emptyBoard = [
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

const initialBoard = [
  ["", "", "U", "", "", "", "", "", "", ""],
  ["", "", "U", "", "", "", "", "B", "", ""],
  ["", "", "U", "", "", "", "", "B", "", ""],
  ["", "", "", "", "", "", "", "B", "", ""],
  ["", "", "", "", "", "", "", "B", "", ""],
  ["", "C", "C", "C", "C", "C", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", ""],
  ["", "", "D", "", "", "", "R", "R", "R", ""],
  ["", "", "D", "", "", "", "", "", "", ""],
];

// SHIPYARDS
const initialShips = {
  carrier: { sank_status: false, units: 5 },
  battleship: { sank_status: false, units: 4 },
  cruiser: { sank_status: false, units: 3 },
  submarine: { sank_status: false, units: 3 },
  destroyer: { sank_status: false, units: 2 },
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

  // -------------- LAUNCH MISSILE WITH TOKEN & NO ERRORS -- MISS -------------------
  describe("When a token is present and no errors & MISS ", () => {
    const row = 0;
    const col = 0;

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
        playerOnePlacements: initialBoard,
        playerTwoPlacements: initialBoard,
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
      const expectedResponse = {
        title: "Battleships",
        endpoint: "battleships",
        turn: 1,
        winner: [],
        finished: false,
        playerOneShips: {
          carrier: { sank_status: false, units: 5 },
          battleship: { sank_status: false, units: 4 },
          cruiser: { sank_status: false, units: 3 },
          submarine: { sank_status: false, units: 3 },
          destroyer: { sank_status: false, units: 2 },
        },
        playerTwoShips: {
          carrier: { sank_status: false },
          battleship: { sank_status: false },
          cruiser: { sank_status: false },
          submarine: { sank_status: false },
          destroyer: { sank_status: false },
        },
        playerOneBoard: [
          ["", "", "U", "", "", "", "", "", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "D", "", "", "", "R", "R", "R", ""],
          ["", "", "D", "", "", "", "", "", "", ""],
        ],
        playerTwoBoard: [
          ["/", "", "", "", "", "", "", "", "", ""],
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
        playerOnePlacements: [
          ["", "", "U", "", "", "", "", "", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "D", "", "", "", "R", "R", "R", ""],
          ["", "", "D", "", "", "", "", "", "", ""],
        ],
        playerTwoPlacements: null,
        playerOne: {
          points: 0,
          username: "first_user123",
        },
        playerTwo: {
          points: 0,
          username: "second_user123",
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("returns a message: 'MISSED'", () => {
      expect(response.body.message).toBe("MISSED");
    });
    test("returns the correct target & actor", () => {
      expect(response.body.actor.toString()).toEqual(user1._id.toString());
      expect(response.body.target.toString()).toEqual(user2._id.toString());
    });
  });

  // -------------- LAUNCH MISSILE WITH TOKEN & NO ERRORS -- HIT -------------------
  describe("When a token is present and no errors & HIT ", () => {
    const row = 1;
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
        playerOnePlacements: initialBoard,
        playerTwoPlacements: initialBoard,
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
    test("returns a battleships object with a populated playerOne, and concealed playerTwoBoard & playerTwoShips ", () => {
      const expectedResponse = {
        title: "Battleships",
        endpoint: "battleships",
        turn: 1,
        winner: [],
        finished: false,
        playerOneShips: {
          carrier: { sank_status: false, units: 5 },
          battleship: { sank_status: false, units: 4 },
          cruiser: { sank_status: false, units: 3 },
          submarine: { sank_status: false, units: 3 }, // decrement --1
          destroyer: { sank_status: false, units: 2 },
        },
        playerTwoShips: {
          carrier: { sank_status: false },
          battleship: { sank_status: false },
          cruiser: { sank_status: false },
          submarine: { sank_status: false },
          destroyer: { sank_status: false },
        },
        playerOneBoard: [
          ["", "", "U", "", "", "", "", "", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "D", "", "", "", "R", "R", "R", ""],
          ["", "", "D", "", "", "", "", "", "", ""],
        ],
        playerTwoBoard: [
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "X", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
        ],
        playerTwoPlacements: null,
        playerOnePlacements: initialBoard,
        playerOne: {
          points: 0,
          username: "first_user123",
        },
        playerTwo: {
          points: 0,
          username: "second_user123",
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("returns a message: 'HIT'", () => {
      expect(response.body.message).toBe("HIT");
    });
    test("returns the correct target & actor", () => {
      expect(response.body.actor.toString()).toEqual(user1._id.toString());
      expect(response.body.target.toString()).toEqual(user2._id.toString());
    });
    test("updates the game on the db", async () => {
      const checkGame = await Battleships.findById(firstGame._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      const expectedResponse = {
        title: "Battleships",
        endpoint: "battleships",
        turn: 1,
        winner: [],
        finished: false,
        playerOneShips: {
          carrier: { sank_status: false, units: 5 },
          battleship: { sank_status: false, units: 4 },
          cruiser: { sank_status: false, units: 3 },
          submarine: { sank_status: false, units: 3 }, // decrement --1
          destroyer: { sank_status: false, units: 2 },
        },
        playerTwoShips: {
          carrier: { sank_status: false, units: 5 },
          battleship: { sank_status: false, units: 4 },
          cruiser: { sank_status: false, units: 3 },
          submarine: { sank_status: false, units: 2 }, // decrement --1
          destroyer: { sank_status: false, units: 2 },
        },
        playerOneBoard: [
          ["", "", "U", "", "", "", "", "", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "D", "", "", "", "R", "R", "R", ""],
          ["", "", "D", "", "", "", "", "", "", ""],
        ],
        playerTwoBoard: [
          ["", "", "U", "", "", "", "", "", "", ""],
          ["", "", "X", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "D", "", "", "", "R", "R", "R", ""],
          ["", "", "D", "", "", "", "", "", "", ""],
        ],
        playerOnePlacements: initialBoard,
        playerTwoPlacements: initialBoard,
        playerOne: {
          points: 0,
          username: "first_user123",
        },
        playerTwo: {
          points: 0,
          username: "second_user123",
        },
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- LAUNCH MISSILE WITH TOKEN & NO ERRORS -- SINK -------------------
  describe("When a token is present and no errors & SINK ", () => {
    const row = 9;
    const col = 2;

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerTwoBoard: [
          ["", "", "U", "", "", "", "", "", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "X", "", "", "", "R", "R", "R", ""],
          ["", "", "D", "", "", "", "", "", "", ""],
        ],
        playerOneShips: initialShips,
        playerTwoShips: {
          carrier: { sank_status: false, units: 5 },
          battleship: { sank_status: false, units: 4 },
          cruiser: { sank_status: false, units: 3 },
          submarine: { sank_status: false, units: 3 },
          destroyer: { sank_status: false, units: 1 },
        },
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
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
      const expectedResponse = {
        title: "Battleships",
        endpoint: "battleships",
        turn: 1,
        winner: [],
        finished: false,
        playerOneShips: {
          carrier: { sank_status: false, units: 5 },
          battleship: { sank_status: false, units: 4 },
          cruiser: { sank_status: false, units: 3 },
          submarine: { sank_status: false, units: 3 },
          destroyer: { sank_status: false, units: 2 },
        },
        playerTwoShips: {
          carrier: { sank_status: false },
          battleship: { sank_status: false },
          cruiser: { sank_status: false },
          submarine: { sank_status: false },
          destroyer: { sank_status: true },
        },
        playerOneBoard: [
          ["", "", "U", "", "", "", "", "", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "D", "", "", "", "R", "R", "R", ""],
          ["", "", "D", "", "", "", "", "", "", ""],
        ],
        playerTwoBoard: [
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "X", "", "", "", "", "", "", ""],
          ["", "", "X", "", "", "", "", "", "", ""],
        ],
        playerOne: {
          points: 0,
          username: "first_user123",
        },
        playerTwo: {
          points: 0,
          username: "second_user123",
        },
        playerTwoPlacements: null,
        playerOnePlacements: initialBoard,
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("returns a message: 'SANK: SHIP TYPE'", () => {
      expect(response.body.message).toBe("SANK: DESTROYER");
    });
    test("returns the correct target & actor", () => {
      expect(response.body.actor.toString()).toEqual(user1._id.toString());
      expect(response.body.target.toString()).toEqual(user2._id.toString());
    });
    test("updates the game on the db", async () => {
      const checkGame = await Battleships.findById(firstGame._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      const expectedResponse = {
        title: "Battleships",
        endpoint: "battleships",
        turn: 1,
        winner: [],
        finished: false,
        playerOneShips: {
          carrier: { sank_status: false, units: 5 },
          battleship: { sank_status: false, units: 4 },
          cruiser: { sank_status: false, units: 3 },
          submarine: { sank_status: false, units: 3 },
          destroyer: { sank_status: false, units: 2 },
        },
        playerTwoShips: {
          carrier: { sank_status: false, units: 5 },
          battleship: { sank_status: false, units: 4 },
          cruiser: { sank_status: false, units: 3 },
          submarine: { sank_status: false, units: 3 },
          destroyer: { sank_status: true, units: 0 },
        },
        playerOneBoard: [
          ["", "", "U", "", "", "", "", "", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "D", "", "", "", "R", "R", "R", ""],
          ["", "", "D", "", "", "", "", "", "", ""],
        ],
        playerTwoBoard: [
          ["", "", "U", "", "", "", "", "", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "X", "", "", "", "R", "R", "R", ""],
          ["", "", "X", "", "", "", "", "", "", ""],
        ],
        playerOne: {
          points: 0,
          username: "first_user123",
        },
        playerTwo: {
          points: 0,
          username: "second_user123",
        },
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- LAUNCH MISSILE WITH TOKEN & NO ERRORS -- WIN -------------------
  describe("When a token is present and no errors & WIN ", () => {
    const row = 9;
    const col = 2;

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerTwoBoard: [
          ["", "", "X", "", "", "", "", "", "", ""],
          ["", "", "X", "", "", "", "", "X", "", ""],
          ["", "", "X", "", "", "", "", "X", "", ""],
          ["", "", "", "", "", "", "", "X", "", ""],
          ["", "", "", "", "", "", "", "X", "", ""],
          ["", "X", "X", "X", "X", "X", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "X", "", "", "", "X", "X", "X", ""],
          ["", "", "D", "", "", "", "", "", "", ""],
        ],
        playerOneShips: initialShips,
        playerTwoShips: {
          carrier: { sank_status: true, units: 0 },
          battleship: { sank_status: true, units: 0 },
          cruiser: { sank_status: true, units: 0 },
          submarine: { sank_status: true, units: 0 },
          destroyer: { sank_status: false, units: 1 },
        },
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
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
      const expectedResponse = {
        title: "Battleships",
        endpoint: "battleships",
        turn: 1,
        winner: [
          {
            points: 0,
            username: "first_user123",
          },
        ],
        finished: true,
        playerOneShips: {
          carrier: { sank_status: false, units: 5 },
          battleship: { sank_status: false, units: 4 },
          cruiser: { sank_status: false, units: 3 },
          submarine: { sank_status: false, units: 3 },
          destroyer: { sank_status: false, units: 2 },
        },
        playerTwoShips: {
          carrier: { sank_status: true },
          battleship: { sank_status: true },
          cruiser: { sank_status: true },
          submarine: { sank_status: true },
          destroyer: { sank_status: true },
        },
        playerOneBoard: [
          ["", "", "U", "", "", "", "", "", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "D", "", "", "", "R", "R", "R", ""],
          ["", "", "D", "", "", "", "", "", "", ""],
        ],
        playerTwoBoard: [
          ["", "", "X", "", "", "", "", "", "", ""],
          ["", "", "X", "", "", "", "", "X", "", ""],
          ["", "", "X", "", "", "", "", "X", "", ""],
          ["", "", "", "", "", "", "", "X", "", ""],
          ["", "", "", "", "", "", "", "X", "", ""],
          ["", "X", "X", "X", "X", "X", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "X", "", "", "", "X", "X", "X", ""],
          ["", "", "X", "", "", "", "", "", "", ""],
        ],
        playerOne: {
          points: 0,
          username: "first_user123",
        },
        playerTwo: {
          points: 0,
          username: "second_user123",
        },
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("returns a message: 'WIN'", () => {
      expect(response.body.message).toBe("WIN");
    });
    test("returns the correct target & actor", () => {
      expect(response.body.actor.toString()).toEqual(user1._id.toString());
      expect(response.body.target.toString()).toEqual(user2._id.toString());
    });
    test("updates the game on the db", async () => {
      const checkGame = await Battleships.findById(firstGame._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      const expectedResponse = {
        title: "Battleships",
        endpoint: "battleships",
        turn: 1,
        winner: [
          {
            points: 0,
            username: "first_user123",
          },
        ],
        finished: true,
        playerOneShips: {
          carrier: { sank_status: false, units: 5 },
          battleship: { sank_status: false, units: 4 },
          cruiser: { sank_status: false, units: 3 },
          submarine: { sank_status: false, units: 3 },
          destroyer: { sank_status: false, units: 2 },
        },
        playerTwoShips: {
          carrier: { sank_status: true, units: 0 },
          battleship: { sank_status: true, units: 0 },
          cruiser: { sank_status: true, units: 0 },
          submarine: { sank_status: true, units: 0 },
          destroyer: { sank_status: true, units: 0 },
        },
        playerOneBoard: [
          ["", "", "U", "", "", "", "", "", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "D", "", "", "", "R", "R", "R", ""],
          ["", "", "D", "", "", "", "", "", "", ""],
        ],
        playerTwoBoard: [
          ["", "", "X", "", "", "", "", "", "", ""],
          ["", "", "X", "", "", "", "", "X", "", ""],
          ["", "", "X", "", "", "", "", "X", "", ""],
          ["", "", "", "", "", "", "", "X", "", ""],
          ["", "", "", "", "", "", "", "X", "", ""],
          ["", "X", "X", "X", "X", "X", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "X", "", "", "", "X", "X", "X", ""],
          ["", "", "X", "", "", "", "", "", "", ""],
        ],
        playerOne: {
          points: 0,
          username: "first_user123",
        },
        playerTwo: {
          points: 0,
          username: "second_user123",
        },
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // ============== ERRORS =========================
  // -------------- LAUNCH MISSILE NO TOKEN -------------------
  describe("When no token is present ", () => {
    const row = 0;
    const col = 0;

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
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
      });
      await game.save();

      // get the id of the game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
        .send({ row: row, col: col });
    });

    // --------- ASSERT: Response code 200, returns a token & populated game with appropriate concealment -----------
    test("responds with a 401 & auth error message", async () => {
      await expectResponseCode(response, 401);
    });
    test("does not return a battleships game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await Battleships.findById(firstGame._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      const expectedResponse = {
        playerOne: {
          // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
          username: "first_user123",
          points: 0,
        },
        playerTwo: {
          // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
          username: "second_user123",
          points: 0,
        },
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: false,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });
  // -------------- GAME NOT FOUND -------------------
  describe("Game not found ", () => {
    const row = 0;
    const col = 0;
    const fakeGameID = "65a5303a0aaf4a563f531d92";
    const errorMessage = "Game not found";
    const errorCode = 404;

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
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
      });
      await game.save();

      // get the id of the game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${fakeGameID}/${putEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ row: row, col: col });
    });

    // --------- ASSERT: Response code 404, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("does not return a battleships game object", async () => {
      await expectNoGameObject(response);
    });
  });
  // -------------- GAME OVER ERROR -------------------
  describe("Game is already over ", () => {
    const row = 0;
    const col = 0;
    const errorCode = 403;
    const errorMessage = "Game already finished.";

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        finished: true,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
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

    // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("does not return a battleships game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await Battleships.findById(firstGame._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      const expectedResponse = {
        playerOne: {
          // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
          username: "first_user123",
          points: 0,
        },
        playerTwo: {
          // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
          username: "second_user123",
          points: 0,
        },
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: true,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });
  // -------------- OUT OF TURN ERROR -------------------
  describe("When it is not your turn ", () => {
    const row = 0;
    const col = 0;
    const errorCode = 403;
    const errorMessage = "It is not your turn.";

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        turn: 3,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
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

    // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("does not return a battleships game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await Battleships.findById(firstGame._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      const expectedResponse = {
        playerOne: {
          // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
          username: "first_user123",
          points: 0,
        },
        playerTwo: {
          // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
          username: "second_user123",
          points: 0,
        },
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 3,
        winner: [],
        finished: false,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });
  // -------------- OBSERVER ERROR -------------------
  describe("When you are not in this game ", () => {
    const row = 0;
    const col = 0;
    const errorCode = 403;
    const errorMessage = "Observers cannot launch missiles";

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user2._id,
        playerTwo: user3._id,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
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

    // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("does not return a battleships game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await Battleships.findById(firstGame._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      const expectedResponse = {
        playerOne: {
          username: "second_user123",
          points: 0,
        },
        playerTwo: {
          username: "third_user123",
          points: 0,
        },
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: false,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });
  // -------------- OUT OF BOUNDS ERROR -------------------
  describe("When the missile target space is out of bounds ", () => {
    const row = 9;
    const col = 10;
    const errorCode = 403;
    const errorMessage = "Launch target is out of bounds.";

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
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
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

    // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("does not return a battleships game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await Battleships.findById(firstGame._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      const expectedResponse = {
        playerOne: {
          // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
          username: "first_user123",
          points: 0,
        },
        playerTwo: {
          // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
          username: "second_user123",
          points: 0,
        },
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: false,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });
  // -------------- OPPONENT NOT READY ERROR -------------------
  describe("When the opponent has not submitted their ships ", () => {
    const row = 0;
    const col = 0;
    const errorCode = 403;
    const errorMessage = "Opponent has not set up their board yet.";

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        turn: 0,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerTwoBoard: emptyBoard,
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
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

    // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("does not return a battleships game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await Battleships.findById(firstGame._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      const expectedResponse = {
        playerOne: {
          username: "first_user123",
          points: 0,
        },
        playerTwo: {
          username: "second_user123",
          points: 0,
        },
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: false,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneBoard: initialBoard,
        playerTwoBoard: emptyBoard,
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- ALREADY HIT SPACE ERROR -------------------
  describe("When the missile target space has already been hit ", () => {
    const row = 0;
    const col = 0;
    // const row = 9;
    // const col = 9;
    const errorCode = 403;
    const errorMessage = "Already hit this space.";

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerTwoBoard: [
          ["X", "", "U", "", "", "", "", "", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "D", "", "", "", "R", "R", "R", ""],
          ["", "", "D", "", "", "", "", "", "", "/"],
        ],
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
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

    // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("does not return a battleships game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await Battleships.findById(firstGame._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      const expectedResponse = {
        playerOne: {
          username: "first_user123",
          points: 0,
        },
        playerTwo: {
          username: "second_user123",
          points: 0,
        },
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: false,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerOneBoard: initialBoard,
        playerTwoBoard: [
          ["X", "", "U", "", "", "", "", "", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "U", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "B", "", ""],
          ["", "C", "C", "C", "C", "C", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", ""],
          ["", "", "D", "", "", "", "R", "R", "R", ""],
          ["", "", "D", "", "", "", "", "", "", "/"],
        ],
        playerTwoPlacements: initialBoard,
        playerOnePlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });
});
