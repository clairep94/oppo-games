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

// ==================== SUBMIT CHOICE ===========================
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

  // -------------- SUBMIT CHOICE WITH TOKEN - single choice -------------------
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
    test("returns a message", () => {
      expect(response.body.message).toBe("Hand Selected: R");
    });
  });

  // // -------------- SUBMIT CHOICE WITH TOKEN - single round - draw -------------------
  describe("When a token is present and no errors - opponent has submitted - draw ", () => {
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user1._id,
        playerTwo: user2._id,
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "R",
          outcome: null,
        },
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
        turn: 1,
        winner: [],
        finished: false,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [{ playerOneChoice: "R", playerTwoChoice: "R" }],
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: null,
          outcome: null,
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("returns a message with the last round & outcome", () => {
      expect(response.body.message).toMatchObject({
        round: 1,
        playerOneChoice: "R",
        playerTwoChoice: "R",
        outcome: "Draw",
      });
    });
  });

  // -------------- SUBMIT CHOICE WITH TOKEN - single round - P>R player one win -------------------
  describe("When a token is present and no errors - opponent has submitted - P>R ", () => {
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user1._id,
        playerTwo: user2._id,
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "R",
          outcome: null,
        },
      });
      await game.save();

      // get the id of the game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ choice: "P" });
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
        turn: 1,
        winner: [],
        finished: false,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [{ playerOneChoice: "P", playerTwoChoice: "R" }],
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: null,
          outcome: null,
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("returns a message with the last round & outcome", () => {
      expect(response.body.message).toMatchObject({
        round: 1,
        playerOneChoice: "P",
        playerTwoChoice: "R",
        outcome: response.body.game.playerOne._id,
      });
    });
  });

  // -------------- SUBMIT CHOICE WITH TOKEN - single round - R>S player two win -------------------
  describe("When a token is present and no errors - opponent has submitted - R>S ", () => {
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user1._id,
        playerTwo: user2._id,
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "R",
          outcome: null,
        },
      });
      await game.save();

      // get the id of the game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ choice: "S" });
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
        turn: 1,
        winner: [],
        finished: false,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [{ playerOneChoice: "S", playerTwoChoice: "R" }],
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: null,
          outcome: null,
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("returns a message with the last round & outcome", () => {
      expect(response.body.message).toMatchObject({
        round: 1,
        playerOneChoice: "S",
        playerTwoChoice: "R",
        outcome: response.body.game.playerTwo._id,
      });
    });
  });

  // -------------- SUBMIT CHOICE WITH TOKEN - single round - S>P player one win -------------------
  describe("When a token is present and no errors - opponent has submitted - R>S ", () => {
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user1._id,
        playerTwo: user2._id,
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "P",
          outcome: null,
        },
      });
      await game.save();

      // get the id of the game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ choice: "S" });
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
        turn: 1,
        winner: [],
        finished: false,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [{ playerOneChoice: "S", playerTwoChoice: "P" }],
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: null,
          outcome: null,
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("returns a message with the last round & outcome", () => {
      expect(response.body.message).toMatchObject({
        round: 1,
        playerOneChoice: "S",
        playerTwoChoice: "P",
        outcome: response.body.game.playerOne._id,
      });
    });
  });

  // -------------- SUBMIT CHOICE WITH TOKEN - 3 game playthrough - playerOne win -------------------
  describe("When a token is present and no errors - 3 game playthrough - playerOne win ", () => {
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user1._id,
        playerTwo: user2._id,
        finishedRounds: [
          {
            playerOneChoice: "S",
            playerTwoChoice: "P",
            outcome: user1._id,
          },
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: user2._id,
          },
        ],
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "P",
          outcome: null,
        },
      });
      await game.save();

      // get the id of the game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ choice: "S" });
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
          username: "first_user123",
          points: 0,
        },
        playerTwo: {
          _id: expect.any(String),
          username: "second_user123",
          points: 0,
        },
        finishedRounds: [
          {
            playerOneChoice: "S",
            playerTwoChoice: "P",
            outcome: expect.any(String),
          },
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: expect.any(String),
          },
          {
            playerOneChoice: "S",
            playerTwoChoice: "P",
            outcome: expect.any(String),
          },
        ],
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 1,
        finished: true,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: null,
          outcome: null,
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("returns the right winner", () => {
      expect(response.body.game.winner[0].username).toBe("first_user123");
    });
    test("returns a message with the last round & outcome", () => {
      expect(response.body.message).toBe(
        `Winner: ${response.body.game.playerOne._id}`
      );
    });
  });

  // -------------- SUBMIT CHOICE WITH TOKEN - 3 game playthrough - draw -------------------
  describe("When a token is present and no errors - 3 game playthrough - draw ", () => {
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user1._id,
        playerTwo: user2._id,
        finishedRounds: [
          {
            playerOneChoice: "S",
            playerTwoChoice: "P",
            outcome: user1._id,
          },
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: user2._id,
          },
        ],
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "S",
          outcome: null,
        },
      });
      await game.save();

      // get the id of the game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ choice: "S" });
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
          username: "first_user123",
          points: 0,
        },
        playerTwo: {
          _id: expect.any(String),
          username: "second_user123",
          points: 0,
        },
        finishedRounds: [
          {
            playerOneChoice: "S",
            playerTwoChoice: "P",
            outcome: expect.any(String),
          },
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: expect.any(String),
          },
          {
            playerOneChoice: "S",
            playerTwoChoice: "S",
            outcome: "Draw",
          },
        ],
        title: gameTitle,
        endpoint: gameEndpoint,
        turn: 1,
        finished: true,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: null,
          outcome: null,
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("returns the right winner", () => {
      expect(response.body.game.winner).toHaveLength(2);
    });
    test("returns a message with the last round & outcome", () => {
      expect(response.body.message).toBe("Draw");
    });
  });

  // ============== ERRORS =========================

  // -------------- SUBMIT CHOICE, NO TOKEN -------------------
  describe("When no token is present ", () => {
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user1._id,
        playerTwo: user2._id,
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "S",
          outcome: null,
        },
      });
      await game.save();

      // get the id of the game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
        .send({ choice: "S" });
    });

    // --------- ASSERT: Response code 401, returns a token & populated game with appropriate concealment -----------
    test("responds with a 401 & auth error message", async () => {
      await expectResponseCode(response, 401);
    });
    test("does not return a rockpaperscissors game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await RockPaperScissors.findById(firstGame._id)
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
        finishedRounds: [],
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "S",
          outcome: null,
        },
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- GAME NOT FOUND -------------------
  describe("Game not found ", () => {
    const fakeGameID = "65a5303a0aaf4a563f531d92";
    const errorMessage = "Game not found";
    const errorCode = 404;

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user1._id,
        playerTwo: user2._id,
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "S",
          outcome: null,
        },
      });
      await game.save();

      // get the id of the game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${fakeGameID}/${putEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ choice: "R" });
    });

    // --------- ASSERT: Response code 404, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("does not return a rockpaperscissors game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await RockPaperScissors.findById(firstGame._id)
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
        finishedRounds: [],
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "S",
          outcome: null,
        },
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- GAME OVER ERROR -------------------
  describe("Game is already over ", () => {
    const errorCode = 403;
    const errorMessage = "Game already finished.";

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user1._id,
        playerTwo: user2._id,
        finished: true,
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "S",
          outcome: null,
        },
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

    // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("does not return a rockpaperscissors game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await RockPaperScissors.findById(firstGame._id)
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
        finishedRounds: [],
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "S",
          outcome: null,
        },
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- OBSERVER ERROR -------------------
  describe("When you are not in this game ", () => {
    const errorCode = 403;
    const errorMessage = "Observers cannot play";

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user2._id,
        playerTwo: user3._id,
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "S",
          outcome: null,
        },
      });
      await game.save();

      // get the id of the game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to launch missile with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${putEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ choice: "S" });
    });

    // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("does not return a rockpaperscissors game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await RockPaperScissors.findById(firstGame._id)
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

        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: "S",
          outcome: null,
        },
        finishedRounds: [],
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- NO PLAYER TWO ERROR -------------------
  describe("When player two has not joined", () => {
    const errorCode = 403;
    const errorMessage = "Cannot play till player two joins.";

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user1._id,
        turn: 0,
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: null,
          outcome: null,
        },
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

    // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("does not return a rockpaperscissors game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await RockPaperScissors.findById(firstGame._id)
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

        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        currentRound: {
          playerOneChoice: null,
          playerTwoChoice: null,
          outcome: null,
        },
        finishedRounds: [],
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- ALREADY SUBMITTED CHOICE ERROR -------------------
  describe("When player has already submitted a choice", () => {
    const errorCode = 403;
    const errorMessage = "Choice already made.";

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new RockPaperScissors({
        playerOne: user1._id,
        playerTwo: user2._id,
        currentRound: {
          playerOneChoice: "S",
          playerTwoChoice: null,
          outcome: null,
        },
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

    // --------- ASSERT: Response code 403, returns a token & populated game with appropriate concealment -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("does not return a rockpaperscissors game object", async () => {
      await expectNoGameObject(response);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await RockPaperScissors.findById(firstGame._id)
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
        finishedRounds: [],
        currentRound: {
          playerOneChoice: "S",
          playerTwoChoice: null,
          outcome: null,
        },
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });
});
