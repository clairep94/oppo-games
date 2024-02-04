const app = require("../../../../app");
const request = require("supertest");
require("../../../mongodb_helper");
const Battleships = require("../../../../models/battleships");
const User = require("../../../../models/user");
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
} = require("../../../utils/TestHelpers");

// ----------- DECLARE VARIABLES -----------------
let token;
let user;
let user2;
let game1;
let response;
let firstGame;
let allGames;

const placements = [
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
const playedBoard = [
  ["", "", "U", "", "", "", "", "", "", ""],
  ["", "", "U", "", "", "", "", "X", "", ""],
  ["", "", "U", "", "", "", "", "B", "", ""],
  ["", "", "", "", "", "", "", "B", "", ""],
  ["", "", "", "", "", "", "", "B", "", ""],
  ["", "C", "C", "C", "C", "C", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", ""],
  ["", "", "D", "", "", "/", "R", "X", "X", ""],
  ["", "", "D", "", "", "", "", "", "", ""],
];
const concealedBoard = [
  ["", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "X", "", ""],
  ["", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "/", "", "X", "X", ""],
  ["", "", "", "", "", "", "", "", "", ""],
];
const unplacedShips = {
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

// ==================== FIND BY ID -- with conceal function ==================================== //
describe(".FINDBYID - /battleships/:gameID ", () => {
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
    await Battleships.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Battleships.deleteMany({});
  });

  // ==================================================================================
  // -------------- FIND BY ID WITH TOKEN, sessionUser is playerOne. ------------------
  describe("When a token is present & the sessionUser is playerOne", () => {
    // search games with a token
    beforeEach(async () => {
      // create game
      game1 = new Battleships({
        playerOne: user._id,
        playerOneBoard: playedBoard,
        playerTwoBoard: playedBoard,
        playerOnePlacements: placements,
        playerTwoPlacements: placements,
      }); // conceal playerTwoBoard when user is viewing the game.
      await game1.save();

      // get all games and find the id of the first game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/battleships/${firstGame._id}`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERTIONS -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a battleships object with a populated playerOne. PlayerOne cannot see PlayerTwo's full board.", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "user123",
          points: 0,
        },
        title: "Battleships",
        endpoint: "battleships",
        turn: 0,
        winner: [],
        finished: false,
        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: unplacedShips, // logged in user
        playerTwoShips: concealedShips, // opponent
        playerOneBoard: playedBoard, // logged in user
        playerTwoBoard: concealedBoard, // opponent
        playerOnePlacements: placements, // logged in user
        playerTwoPlacements: null, // opponent
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
      game1 = new Battleships({
        playerOne: user2._id,
        playerTwo: user._id,
        playerOneBoard: playedBoard,
        playerTwoBoard: playedBoard,
        playerOnePlacements: placements,
        playerTwoPlacements: placements,
      }); // conceal playerTwoBoard when user is viewing the game.
      await game1.save();

      // get all games and find the id of the first game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/battleships/${firstGame._id}`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERTIONS -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a battleships object with a populated playerOne. PlayerOne cannot see PlayerTwo's full board.", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "seconduser123",
          points: 0,
        },
        title: "Battleships",
        endpoint: "battleships",
        turn: 0,
        winner: [],
        finished: false,
        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: concealedShips, // opponent
        playerTwoShips: unplacedShips, // logged in user
        playerOneBoard: concealedBoard, // opponent
        playerTwoBoard: playedBoard, // logged in user
        playerOnePlacements: null, // opponent
        playerTwoPlacements: placements, // logged in player
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
      game1 = new Battleships({
        playerOne: user2._id,
        playerTwo: user3._id,
        playerOneBoard: playedBoard,
        playerTwoBoard: playedBoard,
        playerOnePlacements: placements,
        playerTwoPlacements: placements,
      }); // conceal both boards
      await game1.save();

      // get all games and find the id of the first game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/battleships/${firstGame._id}`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERTIONS -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a battleships object with a populated playerOne. PlayerOne cannot see PlayerTwo's full board.", () => {
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
        title: "Battleships",
        endpoint: "battleships",
        turn: 0,
        winner: [],
        finished: false,
        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: concealedShips,
        playerTwoShips: concealedShips,
        playerOneBoard: concealedBoard,
        playerTwoBoard: concealedBoard,
        playerOnePlacements: null,
        playerTwoPlacements: null,
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
      game1 = new Battleships({
        playerOne: user2._id,
        playerTwo: user3._id,
        playerOneBoard: playedBoard,
        playerTwoBoard: playedBoard,
        playerOnePlacements: placements,
        playerTwoPlacements: placements,
        finished: true,
      }); // conceal both boards
      await game1.save();

      // get all games and find the id of the first game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/battleships/${firstGame._id}`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERTIONS -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a battleships object with a populated playerOne. PlayerOne cannot see PlayerTwo's full board.", () => {
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
        title: "Battleships",
        endpoint: "battleships",
        turn: 0,
        winner: [],
        finished: true,
        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: unplacedShips,
        playerTwoShips: unplacedShips,
        playerOneBoard: playedBoard,
        playerTwoBoard: playedBoard,
        playerOnePlacements: placements,
        playerTwoPlacements: placements,
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
      game1 = new Battleships({ playerOne: user._id });
      game2 = new Battleships({ playerOne: user._id });
      await game1.save();
      await game2.save();

      // get all games and find the id of the first game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/battleships/${fakeGameID}`)
        .set("Authorization", `Bearer ${token}`);
    });

    // --------- ASSERT: response code 404 and error message and new token -----------
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

  // ------------- WHEN NO TOKEN --------------------
  describe("When not token is present", () => {
    // search games with a token
    beforeEach(async () => {
      // create 2 games
      game1 = new Battleships({ playerOne: user._id });
      game2 = new Battleships({ playerOne: user._id });
      await game1.save();
      await game2.save();

      // get all games and find the id of the first game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app).get(`/battleships/${firstGame._id}`);
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
