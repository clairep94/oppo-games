const app = require("../../../app");
const request = require("supertest");
require("../../mongodb_helper");
const RockPaperScissors = require("../../../models/rockpaperscissors");
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

const gameTitle = "RockPaperScissors";
const gameEndpoint = "rockpaperscissors";
const putEndpoint = "submit_choice";

let token;
let user1;
let user2;
let user3;
let game;
let response;

// ==================== LAUNCH MISSILE ===========================
// TODO add winner getting points for the two win conditions.

describe(`SUBMIT_CHOICE - /${gameEndpoint}/:gameID/${putEndpoint}`, () => {
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
    await RockPaperScissors.deleteMany({});
  });
  afterAll(async () => {
    await User.deleteMany({});
    await RockPaperScissors.deleteMany({});
  });

  // // -------------- SUBMIT CHOICE WITH TOKEN -------------------
  describe("When a token is present and no errors - opponent has not submitted yet ", () => {
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user1._id,
        playerTwo: user2._id,
      });
      await game.save();

      // get the id of the game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ choice: "R" });
    });

    // --------- ASSERT: Response code 200, returns a token & populated game with appropriate concealment -----------
    test("responds with a 200", async () => {
      await expectResponseCode(response, 200);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("returns a rockpaperscissors object", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "user123",
          points: 0,
        },
        playerTwo: {
          _id: expect.any(String),
          username: "user123",
          points: 0,
        },
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 0,
        winner: [],
        finished: false,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [],
        currentRound: {
          playerOneChoice: "R",
          playerTwoChoice: null,
          outcome: null,
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

  // ============== ERRORS =========================
  // // -------------- LAUNCH MISSILE NO TOKEN -------------------
  // describe("When no token is present ", () => {
  //   const row = 0;
  //   const col = 0;

  //   // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
  //   beforeEach(async () => {
  //     game = new RockPaperScissors({
  //       playerOne: user1._id,
  //       playerTwo: user2._id,
  //       // BOARD SETUP
  //       playerOneBoard: initialBoard,
  //       playerTwoBoard: initialBoard,
  //       playerOneShips: initialShips,
  //       playerTwoShips: initialShips,
  //       playerTwoPlacements: initialBoard,
  //       playerOnePlacements: initialBoard,
  //     });
  //     await game.save();

  //     // get the id of the game
  //     allGames = await RockPaperScissors.find();
  //     firstGame = allGames[0];

  //     // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
  //     response = await request(app)
  //       .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
  //       .send({ row: row, col: col });
  //   });

  //   // --------- ASSERT: Response code 401, returns a token & populated game with appropriate concealment -----------
  //   test("responds with a 401 & auth error message", async () => {
  //     await expectResponseCode(response, 401);
  //   });
  //   test("does not return a rockpaperscissors game object", async () => {
  //     await expectNoGameObject(response);
  //   });
  //   test("the game in the database is unaffected", async () => {
  //     const checkGame = await RockPaperScissors.findById(firstGame._id)
  //       .populate("playerOne", "_id username points")
  //       .populate("playerTwo", "_id username points")
  //       .populate("winner", "_id username points");

  //     // Convert Mongoose document to a plain JavaScript object
  //     const checkGameObject = checkGame.toObject();

  //     const expectedResponse = {
  //       playerOne: {
  //         // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
  //         username: "first_user123",
  //         points: 0,
  //       },
  //       playerTwo: {
  //         // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
  //         username: "second_user123",
  //         points: 0,
  //       },
  //       title: gameTitle,
  //       endpoint: gameEndpoint,
  //       turn: 0,
  //       winner: [],
  //       finished: false,

  //       // === ROCKPAPERSCISSORS PROPERTIES ====== //
  //       playerOneShips: initialShips,
  //       playerTwoShips: initialShips,
  //       playerOneBoard: initialBoard,
  //       playerTwoBoard: initialBoard,
  //       playerTwoPlacements: initialBoard,
  //       playerOnePlacements: initialBoard,
  //     };
  //     expect(checkGameObject).toMatchObject(expectedResponse);
  //   });
  // });
  // // -------------- GAME NOT FOUND -------------------
  // describe("Game not found ", () => {
  //   const row = 0;
  //   const col = 0;
  //   const fakeGameID = "65a5303a0aaf4a563f531d92";
  //   const errorMessage = "Game not found";
  //   const errorCode = 404;

  //   // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
  //   beforeEach(async () => {
  //     game = new RockPaperScissors({
  //       playerOne: user1._id,
  //       playerTwo: user2._id,
  //       // BOARD SETUP
  //       playerOneBoard: initialBoard,
  //       playerTwoBoard: initialBoard,
  //       playerOneShips: initialShips,
  //       playerTwoShips: initialShips,
  //       playerTwoPlacements: initialBoard,
  //       playerOnePlacements: initialBoard,
  //     });
  //     await game.save();

  //     // get the id of the game
  //     allGames = await RockPaperScissors.find();
  //     firstGame = allGames[0];

  //     // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
  //     response = await request(app)
  //       .put(`/${gameEndpoint}/${fakeGameID}/${putEndpoint}`)
  //       .set("Authorization", `Bearer ${token}`)
  //       .send({ row: row, col: col });
  //   });

  //   // --------- ASSERT: Response code 404, returns a token & populated game with appropriate concealment -----------
  //   test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
  //     await expectError(response, errorCode, errorMessage);
  //   });
  //   test("generates a new token", async () => {
  //     await expectNewToken(response, token);
  //   });
  //   test("does not return a rockpaperscissors game object", async () => {
  //     await expectNoGameObject(response);
  //   });
  // });
  // // -------------- GAME OVER ERROR -------------------
  // describe("Game is already over ", () => {
  //   const row = 0;
  //   const col = 0;
  //   const errorCode = 403;
  //   const errorMessage = "Game already finished.";

  //   // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
  //   beforeEach(async () => {
  //     game = new RockPaperScissors({
  //       playerOne: user1._id,
  //       playerTwo: user2._id,
  //       finished: true,
  //       // BOARD SETUP
  //       playerOneBoard: initialBoard,
  //       playerTwoBoard: initialBoard,
  //       playerOneShips: initialShips,
  //       playerTwoShips: initialShips,
  //       playerTwoPlacements: initialBoard,
  //       playerOnePlacements: initialBoard,
  //     });
  //     await game.save();

  //     // get the id of the game
  //     allGames = await RockPaperScissors.find();
  //     firstGame = allGames[0];

  //     // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
  //     response = await request(app)
  //       .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
  //       .set("Authorization", `Bearer ${token}`)
  //       .send({ row: row, col: col });
  //   });

  //   // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
  //   test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
  //     await expectError(response, errorCode, errorMessage);
  //   });
  //   test("generates a new token", async () => {
  //     await expectNewToken(response, token);
  //   });
  //   test("does not return a rockpaperscissors game object", async () => {
  //     await expectNoGameObject(response);
  //   });
  //   test("the game in the database is unaffected", async () => {
  //     const checkGame = await RockPaperScissors.findById(firstGame._id)
  //       .populate("playerOne", "_id username points")
  //       .populate("playerTwo", "_id username points")
  //       .populate("winner", "_id username points");

  //     // Convert Mongoose document to a plain JavaScript object
  //     const checkGameObject = checkGame.toObject();

  //     const expectedResponse = {
  //       playerOne: {
  //         // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
  //         username: "first_user123",
  //         points: 0,
  //       },
  //       playerTwo: {
  //         // _id: expect.any(String), // commented this out as it doesn't work with this checking technique
  //         username: "second_user123",
  //         points: 0,
  //       },
  //       title: gameTitle,
  //       endpoint: gameEndpoint,
  //       turn: 0,
  //       winner: [],
  //       finished: true,

  //       // === ROCKPAPERSCISSORS PROPERTIES ====== //
  //       playerOneShips: initialShips,
  //       playerTwoShips: initialShips,
  //       playerOneBoard: initialBoard,
  //       playerTwoBoard: initialBoard,
  //       playerTwoPlacements: initialBoard,
  //       playerOnePlacements: initialBoard,
  //     };
  //     expect(checkGameObject).toMatchObject(expectedResponse);
  //   });
  // });
  // // -------------- OBSERVER ERROR -------------------
  // describe("When you are not in this game ", () => {
  //   const row = 0;
  //   const col = 0;
  //   const errorCode = 403;
  //   const errorMessage = "Observers cannot launch missiles";

  //   // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
  //   beforeEach(async () => {
  //     game = new RockPaperScissors({
  //       playerOne: user2._id,
  //       playerTwo: user3._id,
  //       // BOARD SETUP
  //       playerOneBoard: initialBoard,
  //       playerTwoBoard: initialBoard,
  //       playerOneShips: initialShips,
  //       playerTwoShips: initialShips,
  //       playerTwoPlacements: initialBoard,
  //       playerOnePlacements: initialBoard,
  //     });
  //     await game.save();

  //     // get the id of the game
  //     allGames = await RockPaperScissors.find();
  //     firstGame = allGames[0];

  //     // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
  //     response = await request(app)
  //       .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
  //       .set("Authorization", `Bearer ${token}`)
  //       .send({ row: row, col: col });
  //   });

  //   // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
  //   test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
  //     await expectError(response, errorCode, errorMessage);
  //   });
  //   test("generates a new token", async () => {
  //     await expectNewToken(response, token);
  //   });
  //   test("does not return a rockpaperscissors game object", async () => {
  //     await expectNoGameObject(response);
  //   });
  //   test("the game in the database is unaffected", async () => {
  //     const checkGame = await RockPaperScissors.findById(firstGame._id)
  //       .populate("playerOne", "_id username points")
  //       .populate("playerTwo", "_id username points")
  //       .populate("winner", "_id username points");

  //     // Convert Mongoose document to a plain JavaScript object
  //     const checkGameObject = checkGame.toObject();

  //     const expectedResponse = {
  //       playerOne: {
  //         username: "second_user123",
  //         points: 0,
  //       },
  //       playerTwo: {
  //         username: "third_user123",
  //         points: 0,
  //       },
  //       title: gameTitle,
  //       endpoint: gameEndpoint,
  //       turn: 0,
  //       winner: [],
  //       finished: false,

  //       // === ROCKPAPERSCISSORS PROPERTIES ====== //
  //       playerOneShips: initialShips,
  //       playerTwoShips: initialShips,
  //       playerOneBoard: initialBoard,
  //       playerTwoBoard: initialBoard,
  //       playerTwoPlacements: initialBoard,
  //       playerOnePlacements: initialBoard,
  //     };
  //     expect(checkGameObject).toMatchObject(expectedResponse);
  //   });
  // });

  // // -------------- OPPONENT NOT READY ERROR -------------------
  // describe("When the opponent has not submitted their ships ", () => {
  //   const row = 0;
  //   const col = 0;
  //   const errorCode = 403;
  //   const errorMessage = "Opponent has not set up their board yet.";

  //   // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
  //   beforeEach(async () => {
  //     game = new RockPaperScissors({
  //       playerOne: user1._id,
  //       playerTwo: user2._id,
  //       turn: 0,
  //       // BOARD SETUP
  //       playerOneBoard: initialBoard,
  //       playerTwoBoard: emptyBoard,
  //       playerOneShips: initialShips,
  //       playerTwoShips: initialShips,
  //       playerTwoPlacements: initialBoard,
  //       playerOnePlacements: initialBoard,
  //     });
  //     await game.save();

  //     // get the id of the game
  //     allGames = await RockPaperScissors.find();
  //     firstGame = allGames[0];

  //     // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
  //     response = await request(app)
  //       .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
  //       .set("Authorization", `Bearer ${token}`)
  //       .send({ row: row, col: col });
  //   });

  //   // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
  //   test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
  //     await expectError(response, errorCode, errorMessage);
  //   });
  //   test("generates a new token", async () => {
  //     await expectNewToken(response, token);
  //   });
  //   test("does not return a rockpaperscissors game object", async () => {
  //     await expectNoGameObject(response);
  //   });
  //   test("the game in the database is unaffected", async () => {
  //     const checkGame = await RockPaperScissors.findById(firstGame._id)
  //       .populate("playerOne", "_id username points")
  //       .populate("playerTwo", "_id username points")
  //       .populate("winner", "_id username points");

  //     // Convert Mongoose document to a plain JavaScript object
  //     const checkGameObject = checkGame.toObject();

  //     const expectedResponse = {
  //       playerOne: {
  //         username: "first_user123",
  //         points: 0,
  //       },
  //       playerTwo: {
  //         username: "second_user123",
  //         points: 0,
  //       },
  //       title: gameTitle,
  //       endpoint: gameEndpoint,
  //       turn: 0,
  //       winner: [],
  //       finished: false,

  //       // === ROCKPAPERSCISSORS PROPERTIES ====== //
  //       playerOneBoard: initialBoard,
  //       playerTwoBoard: emptyBoard,
  //       playerOneShips: initialShips,
  //       playerTwoShips: initialShips,
  //       playerTwoPlacements: initialBoard,
  //       playerOnePlacements: initialBoard,
  //     };
  //     expect(checkGameObject).toMatchObject(expectedResponse);
  //   });
  // });
});
