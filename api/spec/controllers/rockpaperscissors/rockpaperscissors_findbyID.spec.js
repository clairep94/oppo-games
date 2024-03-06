const app = require("../../../app");
const request = require("supertest");
require("../../mongodb_helper");
const RockPaperScissors = require("../../../models/rockpaperscissors");
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

// ----------- DECLARE VARIABLES -----------------
let token;
let user;
let user2;
let game1;
let response;
let firstGame;
let allGames;

// ==================== FIND BY ID -- with conceal function ==================================== //
describe(".FINDBYID - /rockpaperscissors/:gameID ", () => {
  // ----------- ARRANGE: DB SETUP/CLEANUP, CREATE USER, & TOKEN -----------------
  beforeAll(async () => {
    // create a user
    user = new User({
      email: "test@test.com",
      username: "user123",
      password: "12345678",
    });
    await user.save();
    // create a second user
    user2 = new User({
      email: "test2@test.com",
      username: "seconduser123",
      password: "123456789",
    });
    await user2.save();
    // create a third user
    user3 = new User({
      email: "test3@test.com",
      username: "thirduser123",
      password: "123456789",
    });
    await user3.save();

    // generate token
    token = JWT.sign(
      {
        user_id: user.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );
  });

  beforeEach(async () => {
    // reset database;
    await RockPaperScissors.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await RockPaperScissors.deleteMany({});
  });

  // ==================================================================================
  // -------------- FIND BY ID WITH TOKEN, sessionUser is playerOne. ------------------
  describe("When a token is present & the sessionUser is playerOne", () => {
    // search games with a token
    beforeEach(async () => {
      // create game
      game1 = new RockPaperScissors({
        playerOne: user._id,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: user._id,
          },
        ],
        currentRound: {
          playerOneChoice: "R",
          playerTwoChoice: "P",
          outcome: null,
        },
      }); // conceal playerTwoBoard when user is viewing the game.
      await game1.save();

      // get all games and find the id of the first game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/rockpaperscissors/${firstGame._id}`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERTIONS -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a rockpaperscissors object with a populated playerOne. PlayerOne cannot see PlayerTwo's full board.", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "user123",
          points: 0,
        },
        title: "RockPaperScissors",
        endpoint: "rockpaperscissors",
        turn: 0,
        winner: [],
        finished: false,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: expect.any(String),
          },
        ],
        currentRound: {
          playerOneChoice: "R",
          playerTwoChoice: "submitted",
          outcome: null,
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("generates a new token", async () => {
      expectNewToken(response, token);
    });
  });

  // -------------- FIND BY ID WITH TOKEN, sessionUser is playerTwo. ------------------
  describe("When a token is present & the sessionUser is playerTwo", () => {
    // search games with a token
    beforeEach(async () => {
      // create game
      game1 = new RockPaperScissors({
        playerOne: user2._id,
        playerTwo: user._id,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: user._id,
          },
        ],
        currentRound: {
          playerOneChoice: "R",
          playerTwoChoice: "P",
          outcome: null,
        },
      }); // conceal playerTwoBoard when user is viewing the game.
      await game1.save();

      // get all games and find the id of the first game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/rockpaperscissors/${firstGame._id}`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERTIONS -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a rockpaperscissors object with a populated playerOne. PlayerOne cannot see PlayerTwo's full board.", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "seconduser123",
          points: 0,
        },
        title: "RockPaperScissors",
        endpoint: "rockpaperscissors",
        turn: 0,
        winner: [],
        finished: false,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: expect.any(String),
          },
        ],
        currentRound: {
          playerOneChoice: "submitted",
          playerTwoChoice: "P",
          outcome: null,
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("generates a new token", async () => {
      expectNewToken(response, token);
    });
  });

  // -------------- FIND BY ID WITH TOKEN, sessionUser is an observer. ------------------
  describe("When a token is present & the sessionUser is an observer", () => {
    // search games with a token
    beforeEach(async () => {
      // create game
      game1 = new RockPaperScissors({
        playerOne: user2._id,
        playerTwo: user3._id,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: user._id,
          },
        ],
        currentRound: {
          playerOneChoice: "R",
          playerTwoChoice: "P",
          outcome: null,
        },
      }); // conceal both hannds
      await game1.save();

      // get all games and find the id of the first game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/rockpaperscissors/${firstGame._id}`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERTIONS -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a rockpaperscissors object with a populated playerOne. PlayerOne cannot see PlayerTwo's full board.", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "seconduser123",
          points: 0,
        },
        playerTwo: {
          _id: expect.any(String),
          username: "thirduser123",
          points: 0,
        },
        title: "RockPaperScissors",
        endpoint: "rockpaperscissors",
        turn: 0,
        winner: [],
        finished: false,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: expect.any(String),
          },
        ],
        currentRound: {
          playerOneChoice: "submitted",
          playerTwoChoice: "submitted",
          outcome: null,
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("generates a new token", async () => {
      expectNewToken(response, token);
    });
  });

  // -------------- FIND BY ID WITH TOKEN, sessionUser is an observer but game is won. ------------------
  describe("When a token is present & the sessionUser is an observer, but game is over", () => {
    // search games with a token
    beforeEach(async () => {
      // create game
      game1 = new RockPaperScissors({
        playerOne: user2._id,
        playerTwo: user3._id,
        finished: true,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: user._id,
          },
        ],
        currentRound: {
          playerOneChoice: "R",
          playerTwoChoice: "P",
          outcome: null,
        },
      }); // conceal both boards
      await game1.save();

      // get all games and find the id of the first game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/rockpaperscissors/${firstGame._id}`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERTIONS -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a rockpaperscissors object with a populated playerOne. PlayerOne cannot see PlayerTwo's full board.", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "seconduser123",
          points: 0,
        },
        playerTwo: {
          _id: expect.any(String),
          username: "thirduser123",
          points: 0,
        },
        title: "RockPaperScissors",
        endpoint: "rockpaperscissors",
        turn: 0,
        winner: [],
        finished: true,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: expect.any(String),
          },
        ],
        currentRound: {
          playerOneChoice: "R",
          playerTwoChoice: "P",
          outcome: null,
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("generates a new token", async () => {
      expectNewToken(response, token);
    });
  });

  // -------------- FIND BY ID WITH TOKEN, sessionUser is an observer but currentRound is concluded. ------------------
  describe("When a token is present & the sessionUser is an observer, but currentRound is concluded", () => {
    // search games with a token
    beforeEach(async () => {
      // create game
      game1 = new RockPaperScissors({
        playerOne: user2._id,
        playerTwo: user3._id,
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: user._id,
          },
        ],
        currentRound: {
          playerOneChoice: "R",
          playerTwoChoice: "P",
          outcome: user._id,
        },
      }); // conceal both boards
      await game1.save();

      // get all games and find the id of the first game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/rockpaperscissors/${firstGame._id}`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERTIONS -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a rockpaperscissors object with a populated playerOne. PlayerOne cannot see PlayerTwo's full board.", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "seconduser123",
          points: 0,
        },
        playerTwo: {
          _id: expect.any(String),
          username: "thirduser123",
          points: 0,
        },
        title: "RockPaperScissors",
        endpoint: "rockpaperscissors",
        turn: 0,
        winner: [],
        // === ROCKPAPERSCISSORS PROPERTIES ====== //
        maxRounds: 3,
        finishedRounds: [
          {
            playerOneChoice: "R",
            playerTwoChoice: "P",
            outcome: expect.any(String),
          },
        ],
        currentRound: {
          playerOneChoice: "R",
          playerTwoChoice: "P",
          outcome: expect.any(String),
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("generates a new token", async () => {
      expectNewToken(response, token);
    });
  });

  // ------------- FIND BY ID WITH NO RESULT ------------------
  describe("When a token is present but game not found", () => {
    const fakeGameID = "65a5303a0aaf4a563f531d92";
    const errorMessage = "Game not found";
    const errorCode = 404;

    // search games with a token
    beforeEach(async () => {
      // create 2 games
      game1 = new RockPaperScissors({ playerOne: user._id });
      game2 = new RockPaperScissors({ playerOne: user._id });
      await game1.save();
      await game2.save();

      // get all games and find the id of the first game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/rockpaperscissors/${fakeGameID}`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERT: response code 404 and error message and new token -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });

    test("does not return a rockpaperscissors game object", async () => {
      await expectNoGameObject(response);
    });
  });

  // ------------- WHEN NO TOKEN --------------------
  describe("When not token is present", () => {
    // search games with a token
    beforeEach(async () => {
      // create 2 games
      game1 = new RockPaperScissors({ playerOne: user._id });
      game2 = new RockPaperScissors({ playerOne: user._id });
      await game1.save();
      await game2.save();

      // get all games and find the id of the first game
      allGames = await RockPaperScissors.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app).get(`/rockpaperscissors/${firstGame._id}`);
    });

    // --------- ASSERTIONS -----------
    test("responds with a 401, auth error message, and no new token", async () => {
      expectAuthError(response);
    });
    test("does not return a game object", () => {
      expect(response.body.game).toEqual(undefined);
    });
  });
});
