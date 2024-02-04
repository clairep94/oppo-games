const app = require("../../../app");
const request = require("supertest");
require("../../mongodb_helper");
const Battleships = require("../../../models/battleships");
const User = require("../../../models/user");
const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

const {
  expectedGameObject,
  expectNewToken,
  expectResponseCode,
  expectNoGameObject,
  expectNoToken,
  expectError,
  expectAuthError,
} = require("../../utils/TestHelpers");

// initialise re-used variables
let token;
let user1;
let user2;
let user3;
let game;
let response;

const gameEndpoint = "battleships";
const gameTitle = "Battleships";

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

const initialShips = {
  carrier: { sank_status: false, units: 5 },
  battleship: { sank_status: false, units: 4 },
  cruiser: { sank_status: false, units: 3 },
  submarine: { sank_status: false, units: 3 },
  destroyer: { sank_status: false, units: 2 },
};
const concealedShips = {
  carrier: { sank_status: false },
  battleship: { sank_status: false },
  cruiser: { sank_status: false },
  submarine: { sank_status: false },
  destroyer: { sank_status: false },
};

// TODO FORFEIT & DELETE RULES FOR BATTLESHIPS
// Forfeit - cannot forfeit when ships are not placed -- delete instead?

// ============================= JOIN ========================================= //
describe(`JOIN - /${gameEndpoint}/:gameID/join `, () => {
  // ---------------- ARRANGE: DB cleanup, create 3 Users & token ------------- //
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

  // ---------------------- JOIN AN OPEN GAME WITH A TOKEN --------------------------- //
  describe("When a token is present and no errors", () => {
    // ------ ARRANGE: create a game where logged in user is not playerOne and playerTwo is empty -------
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user2._id,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerOneShips: initialShips,
        playerOnePlacements: initialBoard,
      }); // playerOne: user2; playerTwo is empty
      await game.save();

      // get the id of the game;
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 makes the put request to join ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/join`)
        .set("Authorization", `Bearer ${token}`);
    });

    // ---------- ASSERT: response code 200, return game with user1 is added as playerTwo && valid token ------------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a battleships object with a populated playerOne", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "second_user123",
          points: 0,
        },
        playerTwo: {
          _id: expect.any(String),
          username: "first_user123",
          points: 0,
        },
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: false,
        // BATTLESHIPS PROPERTIES
        playerOneBoard: emptyBoard,
        playerOneShips: concealedShips,
        playerOnePlacements: null,
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("generates a new token", async () => {
      expectNewToken(response, token);
    });
  });

  // -------------- ERROR: JOIN WITH TOKEN & ALREADY IN GAME ------------------- //
  describe("When a token is present but the user is already in the game", () => {
    const errorMessage = "Already in this game";
    const errorCode = 403;

    // ----- ARRANGE: create a game where playerOne and playerTwo are already filled ---------
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user3._id,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerOnePlacements: initialBoard,
        playerTwoPlacements: initialBoard,
      });
      await game.save();

      // get the id of the game;
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: make the put request for user1 to join -------------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/join`)
        .set("Authorization", `Bearer ${token}`);
    });

    // ---------- ASSERTIONS: ------------
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
          username: "third_user123",
          points: 0,
        },
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: false,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerOnePlacements: initialBoard,
        playerTwoPlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- ERROR: JOIN WITH TOKEN & GAME ALREADY FULL ------------------- //
  describe("When a token is present but game is already full", () => {
    const errorMessage = "Game already full.";
    const errorCode = 403;

    // ----- ARRANGE: create a game where playerOne and playerTwo are already filled ---------
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user2._id,
        playerTwo: user3._id,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerOnePlacements: initialBoard,
        playerTwoPlacements: initialBoard,
      });
      await game.save();

      // get the id of the game;
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: make the put request for user1 to join -------------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/join`)
        .set("Authorization", `Bearer ${token}`);
    });

    // ---------- ASSERTIONS: ------------
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
          username: "second_user123",
          points: 0,
        },
        playerTwo: {
          // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
          username: "third_user123",
          points: 0,
        },
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: false,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneBoard: initialBoard,
        playerTwoBoard: initialBoard,
        playerOneShips: initialShips,
        playerTwoShips: initialShips,
        playerOnePlacements: initialBoard,
        playerTwoPlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- ERROR: JOIN WITH NO TOKEN ----------------------
  describe("When not token is present", () => {
    // ------- ARRANGE: create an open game user2 ---------
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user2._id,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerOneShips: initialShips,
        playerOnePlacements: initialBoard,
      });
      await game.save();

      // get the id of the game;
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------- ACT: user1 joins without a token ------------
      response = await request(app).put(`/battleships/${firstGame._id}/join`);
    });

    // --------- ASSERTIONS -----------
    test("responds with a 401", async () => {
      await expectResponseCode(response, 401);
    });
    test("does not return a battleships game object", async () => {
      await expectNoGameObject(response);
    });
    test("does not generate a new token", async () => {
      await expectNoToken(response);
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
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: false,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneBoard: initialBoard,
        playerOneShips: initialShips,
        playerOnePlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
      expect(checkGameObject.playerTwo).toBeFalsy();
    });
  });

  // -------------- ERROR: GAME NOT FOUND -------------------
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
        .put(`/${gameEndpoint}/${fakeGameID}/join`)
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
});

// // ============================== FORFEIT ====================================== //
describe("/battleships/:gameID/forfeit, FORFEIT", () => {
  // ---------------- ARRANGE: DB cleanup, create 3 Users & token ------------- //
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

  // -------------- FORFEIT WITH TOKEN & NO ERRORS ------------------------- //
  // TODO change this to increase other player's user points --> write to user model && battleships model

  describe("When a token is present and no errors", () => {
    // ------ ARRANGE: create a game where logged in user is not playerOne and playerTwo is empty -------
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerOneShips: initialShips,
        playerOnePlacements: initialBoard,
        playerTwoBoard: initialBoard,
        playerTwoShips: initialShips,
        playerTwoPlacements: initialBoard,
      });
      await game.save();

      // get the id of the game;
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 makes the put request to forfeit ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/forfeit`)
        .set("Authorization", `Bearer ${token}`);
    });

    // ---------- ASSERT: response code 200, return game with user1 is added as playerTwo && valid token ------------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a battleships object with a populated playerOne", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "first_user123",
          points: 0,
        },
        playerTwo: {
          _id: expect.any(String),
          username: "second_user123",
          points: 0,
        },
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [
          {
            username: "second_user123",
            points: 0,
          },
        ],
        finished: true,
        // BATTLESHIPS PROPERTIES // NOTE THAT CONCEALMENT IS OFF BC GAME IS OVER.
        playerOneBoard: initialBoard,
        playerOneShips: initialShips,
        playerOnePlacements: initialBoard,
        playerTwoBoard: initialBoard,
        playerTwoShips: initialShips,
        playerTwoPlacements: initialBoard,
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("generates a new token", async () => {
      expectNewToken(response, token);
    });
  });

  // -------------- FORFEIT WITH TOKEN & NOT PART OF GAME -------------------
  describe("When you are not in this game ", () => {
    const errorCode = 403;
    const errorMessage = "Only players can forfeit the game.";

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
        .put(`/${gameEndpoint}/${firstGame._id}/forfeit`)
        .set("Authorization", `Bearer ${token}`);
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

  // -------------- FORFEIT WITH TOKEN & GAME ALREADY FINISHED -------------------
  describe("Game is already over ", () => {
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
        .put(`/${gameEndpoint}/${firstGame._id}/forfeit`)
        .set("Authorization", `Bearer ${token}`);
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

  // -------------- FORFEIT WITH TOKEN & GAME NOT JOINED BY PLAYER TWO -------------------
  describe("Game does not have player Two ", () => {
    const errorCode = 403;
    const errorMessage = "Awaiting player two. Please delete instead.";

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerOneShips: initialShips,
        playerOnePlacements: initialBoard,
      });
      await game.save();

      // get the id of the game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/forfeit`)
        .set("Authorization", `Bearer ${token}`);
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
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: false,

        // === BATTLESHIP PROPERTIES ====== //
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerOneShips: initialShips,
        playerOnePlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- FORFEIT WITH NO TOKEN --------------------------------- //
  describe("When not token is present", () => {
    // ------- ARRANGE: create an open game user2 ---------
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        // BOARD SETUP
        playerOneBoard: initialBoard,
        playerOneShips: initialShips,
        playerOnePlacements: initialBoard,
        playerTwoBoard: initialBoard,
        playerTwoShips: initialShips,
        playerTwoPlacements: initialBoard,
      });
      await game.save();

      // get the id of the game;
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------- ACT: user1 joins without a token ------------
      response = await request(app).put(
        `/battleships/${firstGame._id}/forfeit`
      );
    });

    // --------- ASSERTIONS -----------
    test("responds with a 401", async () => {
      await expectResponseCode(response, 401);
    });
    test("does not return a battleships game object", async () => {
      await expectNoGameObject(response);
    });
    test("does not generate a new token", async () => {
      await expectNoToken(response);
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
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: false,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneBoard: initialBoard,
        playerOneShips: initialShips,
        playerOnePlacements: initialBoard,
        playerTwoBoard: initialBoard,
        playerTwoShips: initialShips,
        playerTwoPlacements: initialBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- FORFEIT WITH TOKEN & GAME NOT FOUND -------------------
  describe("Game not found ", () => {
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

      // ------ ACT: user1 (playerOne) makes the put request to forfeit with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${fakeGameID}/forfeit`)
        .set("Authorization", `Bearer ${token}`);
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
});

// // ==================== DELETE ================================
describe("/battleships/:gameID/delete, DELETE", () => {
  // ---------------- ARRANGE: DB cleanup, create 3 Users & token ------------- //
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

  // -------------- DELETE WITH TOKEN & NO ERRORS -------------------
  describe("When a token is present and no errors (sessionUser is playerOne && playerTwo does not exist)", () => {
    // ------- ARRANGE: create a game with user1 as playerOne ---------
    beforeEach(async () => {
      game = new Battleships({ playerOne: user1._id });
      await game.save();

      // get id of the created game:
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------- ACT: user1 deletes the game ----------------
      response = await request(app)
        .delete(`/battleships/${firstGame._id}/`)
        .set("Authorization", `Bearer ${token}`);
    });

    // ------- ASSERT: response code 200, returns a valid token, and an allGames list that does not include the original game --------------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a games list with the game removed", async () => {
      expect(response.body.games).toEqual([]);
    });
    test("generates a valid token", async () => {
      await expectNewToken(response, token);
    });
    test("removes game from allGames", async () => {
      const updatedAllGames = await Battleships.find();
      expect(updatedAllGames).toHaveLength(0);
    });
  });

  // -------------- DELETE WITH NO TOKEN ----------------------
  describe("When a token is not present", () => {
    // ------- ARRANGE: create a game with user1 as playerOne ---------
    beforeEach(async () => {
      game = new Battleships({ playerOne: user1._id });
      await game.save();

      // get id of the created game:
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------- ACT: user1 deletes the game ----------------
      response = await request(app).delete(`/battleships/${firstGame._id}/`);
    });

    // ------- ASSERT: response code 401, returns no token, no gamesList, and the game has not been removed --------------
    test("responds with a 401 & auth error message & no token geenrated", async () => {
      await expectResponseCode(response, 401);
    });
    test("no gamesList returned", async () => {
      expect(response.body.games).toEqual(undefined);
    });
    test("does not removes game from allGames", async () => {
      const updatedAllGames = await Battleships.find();
      expect(updatedAllGames).toHaveLength(1);
    });
  });

  // -------------- DELETE WITH TOKEN & GAME NOT FOUND -------------------
  describe("Game not found ", () => {
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

      // ------ ACT: delete game ---------
      response = await request(app)
        .delete(`/battleships/${fakeGameID}/`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERT: Response code 404, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("no gamesList returned", async () => {
      expect(response.body.games).toEqual(undefined);
    });
    test("does not removes game from allGames", async () => {
      const updatedAllGames = await Battleships.find();
      expect(updatedAllGames).toHaveLength(1);
    });
  });

  // -------------- DELETE WITH TOKEN & GAME ALREADY FULL -------------------
  describe("Game is already full ", () => {
    const errorMessage = "Only games awaiting player Two can be deleted.";
    const errorCode = 403;

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

      // ------ ACT: delete game ---------
      response = await request(app)
        .delete(`/battleships/${firstGame._id}/`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERT: Response code 404, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("no gamesList returned", async () => {
      expect(response.body.games).toEqual(undefined);
    });
    test("does not removes game from allGames", async () => {
      const updatedAllGames = await Battleships.find();
      expect(updatedAllGames).toHaveLength(1);
    });
  });

  // -------------- DELETE WITH TOKEN & SESSION USER IS NOT THE HOST (playerOne) -------------------
  describe("Session User is not the Game's host (playerOne) ", () => {
    const errorMessage = "Only hosts can delete the game.";
    const errorCode = 403;

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user2._id,
        playerTwo: user1._id,
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

      // ------ ACT: delete game ---------
      response = await request(app)
        .delete(`/battleships/${firstGame._id}/`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERT: Response code 404, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("no gamesList returned", async () => {
      expect(response.body.games).toEqual(undefined);
    });
    test("does not removes game from allGames", async () => {
      const updatedAllGames = await Battleships.find();
      expect(updatedAllGames).toHaveLength(1);
    });
  });
});
