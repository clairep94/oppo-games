const app = require("../../app");
const request = require("supertest");
require("../mongodb_helper");
const TicTacToe = require('../../models/tictactoe');
const User = require('../../models/user');
const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

// initialise re-used variables
let token;
let user1;
let user2;
let user3;
let game;
let response;

// This test file contains all the normal, non-auth and edgecases for gameplay
// TODO add winner getting points for win conditions.

// ==================== PLACE PIECE ===========================
describe("/tictactoe/:gameID/place_piece, PLACE PIECE - with and without token", () => {

  // ---------------- ARRANGE: DB cleanup, create 3 Users & token ------------- 
  beforeAll(async () => {
    // create 3 users. user1 is our sessionUser
    user1 = new User({ email: "user1@test.com", username: "first_user123", password: "12345678" });
    await user1.save();
    user2 = new User({ email: "user2@test.com", username: "second_user123", password: "12345678" });
    await user2.save();
    user3 = new User({ email: "user3@test.com", username: "third_user123", password: "12345678" });
    await user3.save();

    // generate token, logged in with user1;
    token = JWT.sign({
      user_id: user1.id,
      // Backdate this token of 5 minutes
      iat: Math.floor(Date.now() / 1000) - (5 * 60),
      // Set the JWT token to expire in 10 minutes
      exp: Math.floor(Date.now() / 1000) + (10 * 60),
    }, secret);
  });

  // reset database;
  beforeEach(async () => {
    await TicTacToe.deleteMany({});
  });
  afterAll(async () => {
    await User.deleteMany({});
    await TicTacToe.deleteMany({});
  });


  // -------------- PLACE PIECE WITH TOKEN & NO ERRORS -------------------
  describe("When a token is present and no errors", () => {

    // ----- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo, and game is not over ----------
    beforeEach(async () => {
      game = new TicTacToe({playerOne: user1._id, playerTwo: user2._id}) // playerOne: user1; playerTwo: user2
      await game.save();

      // get the id of the game;
      allGames = await TicTacToe.find();
      firstGame = allGames[0];

    // ------ ACT: user1 makes the put request to place a piece with a token ---------
      response = await request(app)
        .put(`/tictactoe/${firstGame._id}/place_piece`)
        .set('Authorization', `Bearer ${token}`)
        .send({row: "A", col: "1"})
    });

    // ---------- ASSERT: response code 200, return game with updated xPlacements, gameboard, turn && valid token && game has been updated in the DB ------------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a tictactoe object with the new move and turn updated", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "first_user123",
          points: 0
        },
        playerTwo: {
          _id: expect.any(String),
          username: "second_user123",
          points: 0
        },
        title: "Tic-Tac-Toe",
        endpoint: "tictactoe",
        turn: 1, //++1 from previous
        winner: [],
        finished: false,
        xPlacements: ["A1"],
        oPlacements: [],
        gameBoard: {
          A: { 1: "X", 2: " ", 3: " " },
          B: { 1: " ", 2: " ", 3: " " },
          C: { 1: " ", 2: " ", 3: " " },
      },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("the game is updated with the new move and turn in the database", async () => {
      const checkGame = await TicTacToe.findById(game._id)
        .populate('playerOne', '_id username points')
        .populate('playerTwo', '_id username points')
        .populate('winner', '_id username points');

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      expect(checkGameObject.playerOne.username).toBe("first_user123");
      expect(checkGameObject.playerTwo.username).toBe("second_user123");
      expect(checkGameObject.turn).toBe(1);
      expect(checkGameObject.winner).toHaveLength(0);
      expect(checkGameObject.finished).toBe(false);
      expect(checkGameObject.xPlacements).toEqual(["A1"]);
      expect(checkGameObject.oPlacements).toHaveLength(0);
      expect(checkGameObject.gameBoard).toEqual({
        A: { 1: "X", 2: " ", 3: " " },
        B: { 1: " ", 2: " ", 3: " " },
        C: { 1: " ", 2: " ", 3: " " },
      });

    });
    test("generates a new token", async () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  });

  // -------------- PLACE PIECE WITH NO TOKEN ----------------------
  describe("When no token is presented", () => {

    // ----- ARRANGE: create a game where sessionUser is playerOne and there is a playerTwo, and game is not over ----------
    beforeEach(async () => {
      game = new TicTacToe({playerOne: user1._id, playerTwo: user2._id}) // playerOne: user1; playerTwo: user2
      await game.save();

      // get the id of the game;
      allGames = await TicTacToe.find();
      firstGame = allGames[0];

    // ------ ACT: user1 makes the put request to place a piece with no token ---------
      response = await request(app)
        .put(`/tictactoe/${firstGame._id}/place_piece`)
        .send({row: "A", col: "1"})
    });

    // ---------- ASSERT: response code 401, return no game object && no token && game has not been updated in the DB ------------
    test("responds with a 401", async () => {
      expect(response.statusCode).toBe(401);
    });
    test("does not return a tictactoe game object", () => {
      expect(response.body.game).toEqual(undefined);
    });
    test("the game in the database is unaffected", async () => {
      const checkGame = await TicTacToe.findById(game._id)
        .populate('playerOne', '_id username points')
        .populate('playerTwo', '_id username points')
        .populate('winner', '_id username points');

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      expect(checkGameObject.playerOne.username).toBe("first_user123");
      expect(checkGameObject.playerTwo.username).toBe("second_user123");
      expect(checkGameObject.turn).toBe(0);
      expect(checkGameObject.winner).toHaveLength(0);
      expect(checkGameObject.finished).toBe(false);
      expect(checkGameObject.xPlacements).toEqual([]);
      expect(checkGameObject.oPlacements).toEqual([]);
      expect(checkGameObject.gameBoard).toEqual({
        A: { 1: " ", 2: " ", 3: " " },
        B: { 1: " ", 2: " ", 3: " " },
        C: { 1: " ", 2: " ", 3: " " },
      });      
    })
    test("does not generate a new token", async () => {
      expect(response.body.token).toEqual(undefined);
    });
})

})

// describe("/tictactoe/:gameID/place_piece, PLACE PIECE - with token, but errors", () => {

//     // ---------------- ARRANGE: DB cleanup, create 3 Users & token ------------- 
//     beforeAll(async () => {
//       // create 3 users. user1 is our sessionUser
//       user1 = new User({ email: "user1@test.com", username: "first_user123", password: "12345678" });
//       await user1.save();
//       user2 = new User({ email: "user2@test.com", username: "second_user123", password: "12345678" });
//       await user2.save();
//       user3 = new User({ email: "user3@test.com", username: "third_user123", password: "12345678" });
//       await user3.save();
  
//       // generate token, logged in with user1;
//       token = JWT.sign({
//         user_id: user1.id,
//         // Backdate this token of 5 minutes
//         iat: Math.floor(Date.now() / 1000) - (5 * 60),
//         // Set the JWT token to expire in 10 minutes
//         exp: Math.floor(Date.now() / 1000) + (10 * 60),
//       }, secret);
//     });
  
//     // reset database;
//     beforeEach(async () => {
//       await TicTacToe.deleteMany({});
//     });
//     afterAll(async () => {
//       await User.deleteMany({});
//       await TicTacToe.deleteMany({});
//     });
  
//   // =============== PLACE PIECE - OUT OF TURN ================= //
  
//   // =============== PLACE PIECE - ALREADY A PIECE THERE ================= //
  
//   // =============== PLACE PIECE - GAME ALREADY OVER ================= //
  
//   // =============== PLACE PIECE - GAME NOT FOUND ================= //
  
//   // =============== PLACE PIECE - YOU'RE NOT IN THIS GAME ================= //

// })

// // =============== PLACE PIECE - GAMEPLAY TO CHECK WIN - X WIN ================= //
// describe("/tictactoe/:gameID/place_piece, PLACE PIECE - gameplay with x-win", () => {

//     // ---------------- ARRANGE: DB cleanup, create 3 Users & token -------------
//     beforeAll(async () => {
//       // create 3 users. user1 is our sessionUser
//       user1 = new User({ email: "user1@test.com", username: "first_user123", password: "12345678" });
//       await user1.save();
//       user2 = new User({ email: "user2@test.com", username: "second_user123", password: "12345678" });
//       await user2.save();
//       user3 = new User({ email: "user3@test.com", username: "third_user123", password: "12345678" });
//       await user3.save();
  
//       // generate token, logged in with user1;
//       token = JWT.sign({
//         user_id: user1.id,
//         // Backdate this token of 5 minutes
//         iat: Math.floor(Date.now() / 1000) - (5 * 60),
//         // Set the JWT token to expire in 10 minutes
//         exp: Math.floor(Date.now() / 1000) + (10 * 60),
//       }, secret);
//     });
  
//     // reset database;
//     beforeEach(async () => {
//       await TicTacToe.deleteMany({});
//     });
//     afterAll(async () => {
//       await User.deleteMany({});
//       await TicTacToe.deleteMany({});
//     });
  

// })

// // =============== PLACE PIECE - GAMEPLAY TO CHECK WIN - O WIN ================= //
// describe("/tictactoe/:gameID/place_piece, PLACE PIECE - gameplay with o-win", () => {

//     // ---------------- ARRANGE: DB cleanup, create 3 Users & token -------------
//     beforeAll(async () => {
//       // create 3 users. user1 is our sessionUser
//       user1 = new User({ email: "user1@test.com", username: "first_user123", password: "12345678" });
//       await user1.save();
//       user2 = new User({ email: "user2@test.com", username: "second_user123", password: "12345678" });
//       await user2.save();
//       user3 = new User({ email: "user3@test.com", username: "third_user123", password: "12345678" });
//       await user3.save();
  
//       // generate token, logged in with user1;
//       token = JWT.sign({
//         user_id: user1.id,
//         // Backdate this token of 5 minutes
//         iat: Math.floor(Date.now() / 1000) - (5 * 60),
//         // Set the JWT token to expire in 10 minutes
//         exp: Math.floor(Date.now() / 1000) + (10 * 60),
//       }, secret);
//     });
  
//     // reset database;
//     beforeEach(async () => {
//       await TicTacToe.deleteMany({});
//     });
//     afterAll(async () => {
//       await User.deleteMany({});
//       await TicTacToe.deleteMany({});
//     });
  

// })

// // =============== PLACE PIECE - GAMEPLAY TO DRAW ================= //
// describe("/tictactoe/:gameID/place_piece, PLACE PIECE - gameplay with draw", () => {

//     // ---------------- ARRANGE: DB cleanup, create 3 Users & token -------------
//     beforeAll(async () => {
//       // create 3 users. user1 is our sessionUser
//       user1 = new User({ email: "user1@test.com", username: "first_user123", password: "12345678" });
//       await user1.save();
//       user2 = new User({ email: "user2@test.com", username: "second_user123", password: "12345678" });
//       await user2.save();
//       user3 = new User({ email: "user3@test.com", username: "third_user123", password: "12345678" });
//       await user3.save();
  
//       // generate token, logged in with user1;
//       token = JWT.sign({
//         user_id: user1.id,
//         // Backdate this token of 5 minutes
//         iat: Math.floor(Date.now() / 1000) - (5 * 60),
//         // Set the JWT token to expire in 10 minutes
//         exp: Math.floor(Date.now() / 1000) + (10 * 60),
//       }, secret);
//     });
  
//     // reset database;
//     beforeEach(async () => {
//       await TicTacToe.deleteMany({});
//     });
//     afterAll(async () => {
//       await User.deleteMany({});
//       await TicTacToe.deleteMany({});
//     });

// })

