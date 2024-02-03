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
const submitEndpoint = "submit_placements";
const resetEndpoint = "reset_placements";

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

const submittedPlacementsBoard = [
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
];

const incompletePlacementsBoard = [
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
];

const concealedBoard = emptyBoard;

const unconcealedBoard = [
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

// SHIPYARDS
const unplacedShips = {
  carrier: { sank_status: false, units: [] },
  battleship: { sank_status: false, units: [] },
  cruiser: { sank_status: false, units: [] },
  submarine: { sank_status: false, units: [] },
  destroyer: { sank_status: false, units: [] },
};

const unconcealedShips = {
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

const concealedShips = {
  carrier: { sank_status: false },
  battleship: { sank_status: false },
  cruiser: { sank_status: false },
  submarine: { sank_status: false },
  destroyer: { sank_status: false },
};

// ==================== SUBMIT SHIPS PLACEMENTS ===========================
// For this method, the frontend will take in ALL of the user's proposed ship placements and enter them at the same time
// The frontend will ask the user "Confirm placements?" before finally making the API request to submit

describe(".SUBMITBOARD - /battleships/:gameID/submit_board ", () => {
  let token;
  let user1;
  let user2;
  let user3;
  let game;
  let response;
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

  // -------------- SUBMIT PLACEMENTS WITH TOKEN & NO ERRORS -------------------
  describe("When a token is present and no errors", () => {
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        // Set playerTwo's board and shipyard as the same ship placements as what playerOne will send in this Put request to see concealed vs. unconcealed boards & shipyards
        playerTwoBoard: unconcealedBoard,
        playerTwoShips: unconcealedShips,
      });
      await game.save();

      // get the id of the game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to submit placements with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${submitEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ placements: submittedPlacementsBoard });
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
          playerOneShips: unconcealedShips,
          playerTwoShips: concealedShips,
          playerOneBoard: unconcealedBoard,
          playerTwoBoard: concealedBoard,
        }
      );
      expect(response.body.game).toMatchObject(expectedResponse);
    });
  });

  // -------------- SUBMIT PLACEMENTS WHEN YOU ARE NOT IN THE GAME -------------------
  describe("When sessionUser is not a player in the game", () => {
    const errorMessage = "Observers cannot place ships";
    const errorCode = 403;

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user2._id,
        playerTwo: user3._id,
      });
      await game.save();

      // get the id of the game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to submit placements with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${submitEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ placements: submittedPlacementsBoard });
    });

    // --------- ASSERT: Response code 403, returns a token & error message -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await Battleships.findById(firstGame._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      const expectedResponse = expectedGameObject(
        "second_user123",
        "third_user123",
        gameTitle,
        gameEndpoint,
        {
          playerOneShips: unplacedShips,
          playerTwoShips: unplacedShips,
          playerOneBoard: emptyBoard,
          playerTwoBoard: emptyBoard,
        }
      );
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- SUBMIT PLACEMENTS WITHOUT PLAYER TWO -------------------
  describe("When player two has not joined", () => {
    const errorMessage = "Cannot place ships till player two joins.";
    const errorCode = 403;
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
      });
      await game.save();

      // get the id of the game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to submit placements with a token ---------
      response = await request(app)
        .put(`/${gameEndpoint}/${firstGame._id}/${submitEndpoint}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ placements: submittedPlacementsBoard });
    });

    // --------- ASSERT: Response code 403, returns a token & error message -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
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
        playerOneShips: unplacedShips,
        playerTwoShips: unplacedShips,
        playerOneBoard: emptyBoard,
        playerTwoBoard: emptyBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- SUBMIT PLACEMENTS WHEN GAME IS ALREADY OVER -------------------
  describe("When the game is already over", () => {
    const errorMessage = "Game already finished.";
    const errorCode = 403;
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        finished: true,
      });
      await game.save();

      // get the id of the game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to submit placements with a token ---------
      response = await request(app)
        .put(`/battleships/${firstGame._id}/submit_placements`)
        .set("Authorization", `Bearer ${token}`)
        .send({ placements: submittedPlacementsBoard });
    });

    // --------- ASSERT: Response code 403, returns a token & error message -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
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
        finished: true,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: unplacedShips,
        playerTwoShips: unplacedShips,
        playerOneBoard: emptyBoard,
        playerTwoBoard: emptyBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- SUBMIT INCOMPLETE PLACEMENTS  -------------------
  describe("When an incomplete board is submitted", () => {
    const errorMessage = "Please place all ships";
    const errorCode = 403;
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        playerTwoBoard: unconcealedBoard,
        playerTwoShips: unconcealedShips,
      });
      await game.save();

      // get the id of the game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to submit placements with a token ---------
      response = await request(app)
        .put(`/battleships/${firstGame._id}/submit_placements`)
        .set("Authorization", `Bearer ${token}`)
        .send({ placements: incompletePlacementsBoard });
    });

    // --------- ASSERT: Response code 403, returns a token & error message -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
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
        playerOneShips: unplacedShips,
        playerTwoShips: unconcealedShips,
        playerOneBoard: emptyBoard,
        playerTwoBoard: unconcealedBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- SUBMIT PLACEMENTS WHEN PLACEMENTS ALREADY EXIST  -------------------
  describe("When ships have already been placed", () => {
    const errorMessage =
      "Ships have already been placed and/or game has already started. Please reset placements or forfeit.";
    const errorCode = 403;
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
    beforeEach(async () => {
      game = new Battleships({
        playerOne: user1._id,
        playerTwo: user2._id,
        playerOneBoard: unconcealedBoard,
        playerOneShips: unconcealedShips,
        playerTwoBoard: unconcealedBoard,
        playerTwoShips: unconcealedShips,
      });
      await game.save();

      // get the id of the game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 (playerOne) makes the put request to submit placements with a token ---------
      response = await request(app)
        .put(`/battleships/${firstGame._id}/submit_placements`)
        .set("Authorization", `Bearer ${token}`)
        .send({ placements: submittedPlacementsBoard });
    });

    // --------- ASSERT: Response code 403, returns a token & error message -----------
    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });
    test("generates a new token", async () => {
      await expectNewToken(response, token);
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
        playerOneShips: unconcealedShips,
        playerTwoShips: unconcealedShips,
        playerOneBoard: unconcealedBoard,
        playerTwoBoard: unconcealedBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- SUBMIT PLACEMENTS NO TOKEN -------------------
  describe("When no token is present", () => {
    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo,
    beforeEach(async () => {
      game = new Battleships({ playerOne: user1._id, playerTwo: user2._id });
      await game.save();

      // get the id of the game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 makes the put request to submit placements with no token ---------
      response = await request(app)
        .put(`/battleships/${firstGame._id}/submit_placements`)
        .send({ placements: submittedPlacementsBoard });
    });

    // ---------- ASSERT: response code 401, return no game object && no token && game has not been updated in the DB ------------
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
        playerOneShips: unplacedShips,
        playerTwoShips: unplacedShips,
        playerOneBoard: emptyBoard,
        playerTwoBoard: emptyBoard,
      };
      expect(checkGameObject).toMatchObject(expectedResponse);
    });
  });

  // -------------- SUBMIT PLACEMENTS GAME NOT FOUND -------------------
  describe("When no game is found", () => {
    const fakeGameID = "65a5303a0aaf4a563f531d92";
    const errorMessage = "Game not found";
    const errorCode = 404;

    // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo,
    beforeEach(async () => {
      game = new Battleships({ playerOne: user1._id, playerTwo: user2._id });
      await game.save();

      // get the id of the game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // ------ ACT: user1 makes the put request to submit placements with token ---------
      response = await request(app)
        .put(`/battleships/${fakeGameID}/submit_placements`)
        .set("Authorization", `Bearer ${token}`)
        .send({ placements: submittedPlacementsBoard });
    });

    // ---------- ASSERT: response code 404 and error message and token ------------

    test(`responds with a ${errorCode} & error message: ${errorMessage}`, async () => {
      await expectError(response, errorCode, errorMessage);
    });

    test("does not return a battleships game object", async () => {
      await expectNoGameObject(response);
    });
  });
});

// ==================== RESET BOARD ============================
// describe(".RESETBOARD - /battleships/:gameID/reset_board ", () => {
//   // ---------------- ARRANGE: DB cleanup, create Users & token -------------
//   beforeAll(async () => {
//     // create 3 users. user1 is our sessionUser
//     user1 = new User({
//       email: "user1@test.com",
//       username: "first_user123",
//       password: "12345678",
//     });
//     await user1.save();
//     user2 = new User({
//       email: "user2@test.com",
//       username: "second_user123",
//       password: "12345678",
//     });
//     await user2.save();
//     user3 = new User({
//       email: "user3@test.com",
//       username: "third_user123",
//       password: "12345678",
//     });
//     await user3.save();

//     // generate token, logged in with user1;
//     token = JWT.sign(
//       {
//         user_id: user1.id,
//         // Backdate this token of 5 minutes
//         iat: Math.floor(Date.now() / 1000) - 5 * 60,
//         // Set the JWT token to expire in 10 minutes
//         exp: Math.floor(Date.now() / 1000) + 10 * 60,
//       },
//       secret
//     );
//   });

//   // reset database;
//   beforeEach(async () => {
//     await Battleships.deleteMany({});
//   });
//   afterAll(async () => {
//     await User.deleteMany({});
//     await Battleships.deleteMany({});
//   });

//   // -------------- SUBMIT PLACEMENTS WITH TOKEN & NO ERRORS -------------------
//   describe("When a token is present and no errors", () => {
//     // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
//     beforeEach(async () => {
//       game = new Battleships({
//         playerOne: user1._id,
//         playerTwo: user2._id,
//         playerOneBoard: unconcealedBoard,
//         playerOneShips: unconcealedShips,
//         playerTwoBoard: emptyBoard,
//         playerTwoShips: unplacedShips,
//       });
//       await game.save();

//       // get the id of the game
//       allGames = await Battleships.find();
//       firstGame = allGames[0];

//       // ------ ACT: user1 (playerOne) makes the put request to submit placements with a token ---------
//       response = await request(app)
//         .put(`/battleships/${firstGame._id}/reset_placements`)
//         .set("Authorization", `Bearer ${token}`);
//     });

//     // --------- ASSERT: Response code 200, returns a token & populated game with appropriate concealment -----------
//     test("responds with a 200", async () => {
//       expect(response.statusCode).toBe(200);
//     });
//     test("returns a battleships object with a populated playerOne, and concealed playerTwoBoard & playerTwoShips", () => {
//       const expectedResponse = {
//         playerOne: {
//           _id: expect.any(String),
//           username: "first_user123",
//           points: 0,
//         },
//         playerTwo: {
//           _id: expect.any(String),
//           username: "second_user123",
//           points: 0,
//         },
//         title: gameTitle,
//         endpoint: gameEndpoint,
//         turn: 0,
//         winner: [],
//         finished: false,

//         // === BATTLESHIP PROPERTIES ====== //
//         playerOneBoard: unconcealedBoard,
//         playerOneShips: unconcealedShips,
//         playerTwoBoard: emptyBoard,
//         playerTwoShips: unplacedShips,
//       };

//       expect(response.body.game).toMatchObject(expectedResponse);
//     });
//     test("generates a new token", async () => {
//       expect(response.body.token).toBeDefined();
//       let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
//       let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
//       expect(newPayload.iat > originalPayload.iat).toEqual(true);
//     });
//   });

//   // -------------- SUBMIT PLACEMENTS NO TOKEN -------------------
//   describe("When no token is present", () => {
//     // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo,
//     beforeEach(async () => {
//       game = new Battleships({
//         playerOne: user1._id,
//         playerTwo: user2._id,
//         playerOneBoard: unconcealedBoard,
//         playerOneShips: unconcealedShips,
//         playerTwoBoard: emptyBoard,
//         playerTwoShips: unplacedShips,
//       });
//       await game.save();

//       // get the id of the game
//       allGames = await Battleships.find();
//       firstGame = allGames[0];

//       // ------ ACT: user1 makes the put request to submit placements with no token ---------
//       response = await request(app)
//         .put(`/battleships/${firstGame._id}/reset_placements`)
//         .send({ placements: submittedPlacementsBoard });
//     });

//     // ---------- ASSERT: response code 401, return no game object && no token && game has not been updated in the DB ------------
//     test("responds with a 401", async () => {
//       expect(response.statusCode).toBe(401);
//     });
//     test("does not return a battleships game object", () => {
//       expect(response.body.game).toEqual(undefined);
//     });
//     test("the game in the database is unaffected", async () => {
//       const checkGame = await Battleships.findById(firstGame._id)
//         .populate("playerOne", "_id username points")
//         .populate("playerTwo", "_id username points")
//         .populate("winner", "_id username points");

//       // Convert Mongoose document to a plain JavaScript object
//       const checkGameObject = checkGame.toObject();

//       const expectedResponse = {
//         playerOne: {
//           username: "first_user123",
//           points: 0,
//         },
//         playerTwo: {
//           username: "second_user123",
//           points: 0,
//         },
//         title: gameTitle,
//         endpoint: gameEndpoint,
//         turn: 0,
//         winner: [],
//         finished: false,

//         // === BATTLESHIP PROPERTIES ====== //
//         playerOneBoard: unconcealedBoard,
//         playerOneShips: unconcealedShips,
//         playerTwoBoard: emptyBoard,
//         playerTwoShips: unplacedShips,
//       };
//       expect(checkGameObject).toMatchObject(expectedResponse);
//     });
//   });

//   // -------------- RESET PLACEMENTS GAME NOT FOUND -------------------
//   describe("When no game is found", () => {
//     const fakeGameID = "65a5303a0aaf4a563f531d92";

//     // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo,
//     beforeEach(async () => {
//       game = new Battleships({ playerOne: user1._id, playerTwo: user2._id });
//       await game.save();

//       // get the id of the game
//       allGames = await Battleships.find();
//       firstGame = allGames[0];

//       // ------ ACT: user1 makes the put request to submit placements with no token ---------
//       response = await request(app)
//         .put(`/battleships/${fakeGameID}/reset_placements`)
//         .set("Authorization", `Bearer ${token}`);
//     });

//     // ---------- ASSERT: response code 404 and error message and token ------------
//     test("responds with a 404 with a error message: Game not found.", async () => {
//       expect(response.statusCode).toBe(404);
//       expect(response.body.error).toBe("Game not found");
//     });
//     test("does not return a battleships game object", () => {
//       expect(response.body.game).toEqual(undefined);
//     });
//   });

//   // -------------- RESET PLACEMENTS WHEN YOU ARE NOT IN THE GAME -------------------
//   describe("When sessionUser is not a player in the game", () => {
//     // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
//     beforeEach(async () => {
//       game = new Battleships({
//         playerOne: user2._id,
//         playerTwo: user3._id,
//         playerOneBoard: unconcealedBoard,
//         playerOneShips: unconcealedShips,
//         playerTwoBoard: emptyBoard,
//         playerTwoShips: unplacedShips,
//       });
//       await game.save();

//       // get the id of the game
//       allGames = await Battleships.find();
//       firstGame = allGames[0];

//       // ------ ACT: user1 (playerOne) makes the put request to submit placements with a token ---------
//       response = await request(app)
//         .put(`/battleships/${firstGame._id}/reset_placements`)
//         .set("Authorization", `Bearer ${token}`);
//     });

//     // --------- ASSERT: Response code 403, returns a token & error message -----------
//     test("responds with a 403 with a error message: You are not in this game ", async () => {
//       expect(response.statusCode).toBe(403);
//       expect(response.body.error).toBe("You are not in this game");
//     });
//     test("generates a new token", async () => {
//       expect(response.body.token).toBeDefined();
//       let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
//       let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
//       expect(newPayload.iat > originalPayload.iat).toEqual(true);
//     });
//     test("the game in the database is unaffected", async () => {
//       const checkGame = await Battleships.findById(firstGame._id)
//         .populate("playerOne", "_id username points")
//         .populate("playerTwo", "_id username points")
//         .populate("winner", "_id username points");

//       // Convert Mongoose document to a plain JavaScript object
//       const checkGameObject = checkGame.toObject();

//       const expectedResponse = {
//         playerOne: {
//           username: "second_user123",
//           points: 0,
//         },
//         playerTwo: {
//           username: "third_user123",
//           points: 0,
//         },

//         title: gameTitle,
//         endpoint: gameEndpoint,
//         turn: 0,
//         winner: [],
//         finished: false,

//         // === BATTLESHIP PROPERTIES ====== //
//         playerOneBoard: unconcealedBoard,
//         playerOneShips: unconcealedShips,
//         playerTwoBoard: emptyBoard,
//         playerTwoShips: unplacedShips,
//       };
//       expect(checkGameObject).toMatchObject(expectedResponse);
//     });
//   });

//   // -------------- RESET PLACEMENTS WHEN OPPONENT HAS ALREADY SUBMITTED THEIR PLACEMENTS -------------------
//   describe("When the opponent has already submitted their placements", () => {
//     // ------- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo and we have a token,
//     beforeEach(async () => {
//       game = new Battleships({
//         playerOne: user1._id,
//         playerTwo: user2._id,
//         playerOneBoard: unconcealedBoard,
//         playerOneShips: unconcealedShips,
//         playerTwoBoard: unconcealedBoard,
//         playerTwoShips: unconcealedShips,
//       });
//       await game.save();

//       // get the id of the game
//       allGames = await Battleships.find();
//       firstGame = allGames[0];

//       // ------ ACT: user1 (playerOne) makes the put request to submit placements with a token ---------
//       response = await request(app)
//         .put(`/battleships/${firstGame._id}/reset_placements`)
//         .set("Authorization", `Bearer ${token}`);
//     });

//     // --------- ASSERT: Response code 403, returns a token & error message -----------
//     test("responds with a 403 with a error message: You are not in this game ", async () => {
//       expect(response.statusCode).toBe(403);
//       expect(response.body.error).toBe("You are not in this game");
//     });
//     test("generates a new token", async () => {
//       expect(response.body.token).toBeDefined();
//       let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
//       let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
//       expect(newPayload.iat > originalPayload.iat).toEqual(true);
//     });
//     test("the game in the database is unaffected", async () => {
//       const checkGame = await Battleships.findById(firstGame._id)
//         .populate("playerOne", "_id username points")
//         .populate("playerTwo", "_id username points")
//         .populate("winner", "_id username points");

//       // Convert Mongoose document to a plain JavaScript object
//       const checkGameObject = checkGame.toObject();

//       const expectedResponse = {
//         playerOne: {
//           username: "first_user123",
//           points: 0,
//         },
//         playerTwo: {
//           username: "second_user123",
//           points: 0,
//         },

//         title: gameTitle,
//         endpoint: gameEndpoint,
//         turn: 0,
//         winner: [],
//         finished: false,

//         // === BATTLESHIP PROPERTIES ====== //
//         playerOneBoard: unconcealedBoard,
//         playerOneShips: unconcealedShips,
//         playerTwoBoard: unconcealedBoard,
//         playerTwoShips: unconcealedShips,
//       };
//       expect(checkGameObject).toMatchObject(expectedResponse);
//     });
//   });
// });
