const app = require("../../../app");
const request = require("supertest");
require("../../mongodb_helper");
const TicTacToe = require("../../../models/tictactoe");
const User = require("../../../models/user");
const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

// initialise variables
let token;
let user1;
let user2;
let user3;
let game;
let response;

// This test file contains all the normal, non-auth and edgecases for gameplay
// TODO add winner getting points for the two win conditions.

// ==================== PLACE PIECE ===========================
describe("/tictactoe/:gameID/place_piece, PLACE PIECE - with and without token", () => {
  // ---------------- ARRANGE: DB cleanup, create 3 Users & token -------------
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
      game = new TicTacToe({ playerOne: user1._id, playerTwo: user2._id }); // playerOne: user1; playerTwo: user2
      await game.save();

      // get the id of the game;
      allGames = await TicTacToe.find();
      firstGame = allGames[0];

      // ------ ACT: user1 makes the put request to place a piece with a token ---------
      response = await request(app)
        .put(`/tictactoe/${firstGame._id}/place_piece`)
        .set("Authorization", `Bearer ${token}`)
        .send({ row: "A", col: "1" });
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
          points: 0,
        },
        playerTwo: {
          _id: expect.any(String),
          username: "second_user123",
          points: 0,
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
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

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
      game = new TicTacToe({ playerOne: user1._id, playerTwo: user2._id }); // playerOne: user1; playerTwo: user2
      await game.save();

      // get the id of the game;
      allGames = await TicTacToe.find();
      firstGame = allGames[0];

      // ------ ACT: user1 makes the put request to place a piece with no token ---------
      response = await request(app)
        .put(`/tictactoe/${firstGame._id}/place_piece`)
        .send({ row: "A", col: "1" });
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
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

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
    });
    test("does not generate a new token", async () => {
      expect(response.body.token).toEqual(undefined);
    });
  });
});

describe("/tictactoe/:gameID/place_piece, PLACE PIECE - with token, but errors", () => {
  // ---------------- ARRANGE: DB cleanup, create 3 Users & token -------------
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
    await TicTacToe.deleteMany({});
  });
  afterAll(async () => {
    await User.deleteMany({});
    await TicTacToe.deleteMany({});
  });

  // =============== PLACE PIECE - OUT OF TURN ================= //
  describe("Playing out of turn - playerOne(X)", () => {});
  describe("Playing out of turn - playerOne(O)", () => {});

  // =============== PLACE PIECE - ALREADY A PIECE THERE ================= //
  describe("Placing a piece where there is already a piece", () => {
    // ------- ARRANGE: create a game with user1 and user2, and where A1 is occupied with an "X" and A2 is occupied with a "O" on turn 2 ---------
    beforeEach(async () => {
      const setUpGameboard = {
        A: { 1: "X", 2: "O", 3: " " },
        B: { 1: " ", 2: " ", 3: " " },
        C: { 1: " ", 2: " ", 3: " " },
      };

      game = new TicTacToe({
        playerOne: user1._id,
        playerTwo: user2._id,
        xPlacements: ["A1"],
        oPlacements: ["A2"],
        gameBoard: setUpGameboard,
        turn: 2,
      });
      await game.save();

      // get id of the created game:
      allGames = await TicTacToe.find();
      firstGame = allGames[0];

      // ------- ACT: user1 tries to place a piece on A1 ----------------
      response = await request(app)
        .put(`/tictactoe/${firstGame._id}/place_piece`)
        .set("Authorization", `Bearer ${token}`)
        .send({ row: "A", col: "1" });
    });
    // --------- ASSERTIONS: 403, error message: "Cannot place piece on occupied tile.", returns token & unchanged game, game in DB is unchanged. -----------
    test("responds with a 403", async () => {
      expect(response.statusCode).toBe(403);
    });
    test("responds with an error message: 'Cannot place piece on occupied tile.'", () => {
      expect(response.body.error).toBe("Cannot place piece on occupied tile.");
    });
    test("returns an unchanged game object", () => {
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
        title: "Tic-Tac-Toe",
        endpoint: "tictactoe",
        turn: 2,
        winner: [],
        finished: false,
        xPlacements: ["A1"],
        oPlacements: ["A2"],
        gameBoard: {
          A: { 1: "X", 2: "O", 3: " " },
          B: { 1: " ", 2: " ", 3: " " },
          C: { 1: " ", 2: " ", 3: " " },
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("game in the database remains unchanged", async () => {
      const checkGame = await TicTacToe.findById(game._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      expect(checkGameObject.playerOne.username).toBe("first_user123");
      expect(checkGameObject.playerTwo.username).toBe("second_user123");
      expect(checkGameObject.turn).toBe(2);
      expect(checkGameObject.winner).toHaveLength(0);
      expect(checkGameObject.finished).toBe(false);
      expect(checkGameObject.xPlacements).toEqual(["A1"]);
      expect(checkGameObject.oPlacements).toEqual(["A2"]);
      expect(checkGameObject.gameBoard).toEqual({
        A: { 1: "X", 2: "O", 3: " " },
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

  // =============== PLACE PIECE - GAME ALREADY OVER ================= //
  describe("Placing a piece when the game is already over", () => {
    // ------- ARRANGE: create a game with user1 and user2, and where finished is true and there is a winner ---------
    beforeEach(async () => {
      game = new TicTacToe({
        playerOne: user1._id,
        playerTwo: user2._id,
        turn: 0,
        finished: true,
        winner: [user1._id],
      });
      await game.save();

      // get id of the created game:
      allGames = await TicTacToe.find();
      firstGame = allGames[0];

      // ------- ACT: user1 tries to place a piece on A1 ----------------
      response = await request(app)
        .put(`/tictactoe/${firstGame._id}/place_piece`)
        .set("Authorization", `Bearer ${token}`)
        .send({ row: "A", col: "1" });
    });
    // --------- ASSERTIONS: 403, error message: "Game already finished.", returns token & unchanged game, game in DB is unchanged. -----------
    test("responds with a 403", async () => {
      expect(response.statusCode).toBe(403);
    });
    test("responds with an error message: 'Game already finished.'", () => {
      expect(response.body.error).toBe("Game already finished.");
    });
    test("returns an unchanged game object", () => {
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
        title: "Tic-Tac-Toe",
        endpoint: "tictactoe",
        turn: 0,
        winner: [
          {
            _id: expect.any(String),
            username: "first_user123",
            points: 0,
          },
        ],
        finished: true,
        xPlacements: [],
        oPlacements: [],
        gameBoard: {
          A: { 1: " ", 2: " ", 3: " " },
          B: { 1: " ", 2: " ", 3: " " },
          C: { 1: " ", 2: " ", 3: " " },
        },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    });
    test("game in the database remains unchanged", async () => {
      const checkGame = await TicTacToe.findById(game._id)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Convert Mongoose document to a plain JavaScript object
      const checkGameObject = checkGame.toObject();

      expect(checkGameObject.playerOne.username).toBe("first_user123");
      expect(checkGameObject.playerTwo.username).toBe("second_user123");
      expect(checkGameObject.turn).toBe(0);
      expect(checkGameObject.winner).toHaveLength(1);
      expect(checkGameObject.finished).toBe(true);
      expect(checkGameObject.xPlacements).toEqual([]);
      expect(checkGameObject.oPlacements).toEqual([]);
      expect(checkGameObject.gameBoard).toEqual({
        A: { 1: " ", 2: " ", 3: " " },
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

  // The following are not malicious and/or covered by other errors above and can be additionally covered in the Frontend.:
  // =============== PLACE PIECE - YOU'RE NOT IN THIS GAME ================= //
  // =============== PLACE PIECE - GAME NOT FOUND ================= //
});

// =============== PLACE PIECE - GAMEPLAY TO CHECK WIN - X WIN ================= //
describe("Gameplay with x-win", () => {
  // this also checks for the 'already a piece there' and 'out of turn' error
  // this playthrough purposely sets the xPlacements in a certain order to test that the checkWins function tests of winning combinations in ANY order and as any portion of a longer xPlacements array.

  /* GAMEPLAY:
    turn 1: user1 places X in C3 (24 ms)
    turn 2: user1 tries to play again - out of turn error (15 ms)
    turn 2: user2 places O in C2 (16 ms)
    turn 3: user1 places X in C2 - occupied tile error (16 ms)
    turn 3: user1 places X in A1 (16 ms)
    turn 4: user2 places O in A2 (20 ms)
    turn 5: user1 places X in A3 (23 ms)
    turn 6: user2 places O in B3 (17 ms)
    turn 7: user1 places X in B2 - X WINS (17 ms)
    turn 7 & game over: user1 tries to play after the game is over (13 ms)
  */

  // ---------------- ARRANGE: DB cleanup, create 3 Users & token, create a blank game with user1 and user2 -------------
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

    // create a game with user1 and user2
    game = new TicTacToe({ playerOne: user1._id, playerTwo: user2._id });
    await game.save();

    // get the id of the game;
    allGames = await TicTacToe.find();
    firstGame = allGames[0];
  });

  afterAll(async () => {
    await User.deleteMany({});
    await TicTacToe.deleteMany({});
  });

  // ------------- ACT & ASSERT GAMEPLAY: --------------------
  // TURN 1: -------------
  test("turn 1: user1 places X in C3", async () => {
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "3" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(1);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual([]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: " ", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 2: -----------
  test("turn 2: user1 tries to play again - out of turn error", async () => {
    // user1 still logged in:
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("It is not your turn.");
    expect(response.body.game.turn).toBe(1);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual([]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: " ", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  test("turn 2: user2 places O in C2", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user 2 places O in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(2);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 3: -----------
  test("turn 3: user1 places X in C2 - occupied tile error", async () => {
    // generate token, logged in with user2;
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

    // user 2 places O in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("Cannot place piece on occupied tile.");
    expect(response.body.game.turn).toBe(2);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  test("turn 3: user1 places X in A1", async () => {
    // user 1 places X in A1
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "1" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(3);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 4: -----------
  test("turn 4: user2 places O in A2", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user 2 places O in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "2" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(4);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "A2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "O", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 5: -----------
  test("turn 5: user1 places X in A3", async () => {
    // generate token, logged in with user2;
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

    // user1 places X in A3
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "3" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(5);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1", "A3"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "A2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "O", 3: "X" },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 6: -----------
  test("turn 6: user2 places O in B3", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user2 places O in B3
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "B", col: "3" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(6);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1", "A3"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "A2", "B3"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "O", 3: "X" },
      B: { 1: " ", 2: " ", 3: "O" },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 7 -------- WINNING TURN ------------------
  test("turn 7: user1 places X in B2 - X WINS", async () => {
    // generate token, logged in with user2;
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

    // user1 places X in B2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "B", col: "2" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(7);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1", "A3", "B2"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "A2", "B3"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "O", 3: "X" },
      B: { 1: " ", 2: "X", 3: "O" },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
    // ADDITIONAL WIN PROPERTIES:
    expect(response.body.game.finished).toBe(true);
    expect(response.body.game.winner).toEqual([
      {
        _id: expect.any(String),
        username: "first_user123",
        points: 0,
      },
    ]);
  });
  // TODO add user updates to add points to user1

  // GAME OVER-------- Try to play after game is over -- error ------------------
  test("turn 7 & game over: user1 tries to play after the game is over", async () => {
    // generate token, logged in with user2;
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

    // user1 places X in B2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "1" });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("Game already finished.");
    expect(response.body.game.turn).toBe(7);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1", "A3", "B2"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "A2", "B3"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "O", 3: "X" },
      B: { 1: " ", 2: "X", 3: "O" },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
    // ADDITIONAL WIN PROPERTIES:
    expect(response.body.game.finished).toBe(true);
    expect(response.body.game.winner).toEqual([
      {
        _id: expect.any(String),
        username: "first_user123",
        points: 0,
      },
    ]);
  });
});

// =============== PLACE PIECE - GAMEPLAY TO CHECK WIN - O WIN ================= //
describe("Gameplay with o-win", () => {
  // this also checks for the 'already a piece there' and 'out of turn' error
  // this playthrough purposely sets the xPlacements in a certain order to test that the checkWins function tests of winning combinations in ANY order and as any portion of a longer xPlacements array.

  /* GAMEPLAY:
    turn 1: user1 places X in C3 (24 ms)
    turn 2: user1 tries to play again - out of turn error (15 ms)
    turn 2: user2 places O in C2 (16 ms)
    turn 3: user1 places X in C2 - occupied tile error (16 ms)
    turn 3: user1 places X in A1 (16 ms)
    turn 4: user2 places O in A2 (20 ms)
    turn 5: user1 places X in A3 (23 ms)
    turn 6: user2 places O in B2 -- O WIN (17 ms)
    turn 6 & game over: user1 tries to play after the game is over (13 ms)
  */

  // ---------------- ARRANGE: DB cleanup, create 3 Users & token, create a blank game with user1 and user2 -------------
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

    // create a game with user1 and user2
    game = new TicTacToe({ playerOne: user1._id, playerTwo: user2._id });
    await game.save();

    // get the id of the game;
    allGames = await TicTacToe.find();
    firstGame = allGames[0];
  });

  afterAll(async () => {
    await User.deleteMany({});
    await TicTacToe.deleteMany({});
  });

  // ------------- ACT & ASSERT GAMEPLAY: --------------------
  // TURN 1: -------------
  test("turn 1: user1 places X in C3", async () => {
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "3" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(1);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual([]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: " ", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 2: -----------
  test("turn 2: user1 tries to play again - out of turn error", async () => {
    // user1 still logged in:
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("It is not your turn.");
    expect(response.body.game.turn).toBe(1);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual([]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: " ", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  test("turn 2: user2 places O in C2", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user 2 places O in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(2);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 3: -----------
  test("turn 3: user1 places X in C2 - occupied tile error", async () => {
    // generate token, logged in with user2;
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

    // user 2 places O in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("Cannot place piece on occupied tile.");
    expect(response.body.game.turn).toBe(2);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  test("turn 3: user1 places X in A1", async () => {
    // user 1 places X in A1
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "1" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(3);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 4: -----------
  test("turn 4: user2 places O in A2", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user 2 places O in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "2" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(4);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "A2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "O", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 5: -----------
  test("turn 5: user1 places X in A3", async () => {
    // generate token, logged in with user2;
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

    // user1 places X in A3
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "3" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(5);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1", "A3"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "A2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "O", 3: "X" },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 6: ----------- WINNING TURN: O ------------
  test("turn 6: user2 places O in B2 -- O WIN", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user2 places O in B2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "B", col: "2" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(6);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1", "A3"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "A2", "B2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "O", 3: "X" },
      B: { 1: " ", 2: "O", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
    expect(response.body.game.finished).toBe(true);
    expect(response.body.game.winner).toEqual([
      {
        _id: expect.any(String),
        username: "second_user123",
        points: 0,
      },
    ]);
    // TODO add user updates to add points to user2
  });

  // GAME OVER-------- Try to play after game is over -- error ------------------
  test("turn 6 & game over: user1 tries to play after the game is over", async () => {
    // generate token, logged in with user2;
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

    // user1 places X in B2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "1" });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("Game already finished.");
    expect(response.body.game.turn).toBe(6);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1", "A3"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "A2", "B2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "O", 3: "X" },
      B: { 1: " ", 2: "O", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
    expect(response.body.game.finished).toBe(true);
    expect(response.body.game.winner).toEqual([
      {
        _id: expect.any(String),
        username: "second_user123",
        points: 0,
      },
    ]);
  });
});

// =============== PLACE PIECE - GAMEPLAY TO CHECK DRAW ================= //
describe("Gameplay with draw", () => {
  // this also checks for the 'already a piece there' and 'out of turn' error
  // this playthrough purposely sets the xPlacements in a certain order to test that the checkWins function tests of winning combinations in ANY order and as any portion of a longer xPlacements array.

  /* GAMEPLAY:
    turn 1: user1 places X in C3 (16 ms)
    turn 2: user1 tries to play again - out of turn error (12 ms)
    turn 2: user2 places O in C2 (13 ms)
    turn 3: user1 places X in C2 - occupied tile error (11 ms)
    turn 3: user1 places X in C1 (14 ms)
    turn 4: user2 places O in B2 (15 ms)
    turn 5: user1 places X in A2 (18 ms)
    turn 6: user2 places O in B3 (14 ms)
    turn 7: user1 places X in B1 (14 ms)
    turn 8: user2 places O in A1 (14 ms)
    turn 9: user1 places X in A3 -- DRAW (15 ms)
    turn 9+ & game over: user1 tries to play after the game is over (13 ms)
  */

  // ---------------- ARRANGE: DB cleanup, create 3 Users & token, create a blank game with user1 and user2 -------------
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

    // create a game with user1 and user2
    game = new TicTacToe({ playerOne: user1._id, playerTwo: user2._id });
    await game.save();

    // get the id of the game;
    allGames = await TicTacToe.find();
    firstGame = allGames[0];
  });

  afterAll(async () => {
    await User.deleteMany({});
    await TicTacToe.deleteMany({});
  });

  // ------------- ACT & ASSERT GAMEPLAY: --------------------
  // TURN 1: -------------
  test("turn 1: user1 places X in C3", async () => {
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "3" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(1);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual([]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: " ", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 2: -----------
  test("turn 2: user1 tries to play again - out of turn error", async () => {
    // user1 still logged in:
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("It is not your turn.");
    expect(response.body.game.turn).toBe(1);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual([]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: " ", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  test("turn 2: user2 places O in C2", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user 2 places O in C2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(2);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 3: -----------
  test("turn 3: user1 places X in C2 - occupied tile error", async () => {
    // generate token, logged in with user2;
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

    // user 2 places O in C2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("Cannot place piece on occupied tile.");
    expect(response.body.game.turn).toBe(2);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  test("turn 3: user1 places X in C1", async () => {
    // user 1 places X in C1
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "1" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(3);
    expect(response.body.game.xPlacements).toEqual(["C3", "C1"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 4: -----------
  test("turn 4: user2 places O in B2", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user 2 places O in B2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "B", col: "2" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(4);
    expect(response.body.game.xPlacements).toEqual(["C3", "C1"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: "O", 3: " " },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 5: -----------
  test("turn 5: user1 places X in A2", async () => {
    // generate token, logged in with user2;
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

    // user1 places X in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "2" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(5);
    expect(response.body.game.xPlacements).toEqual(["C3", "C1", "A2"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: "X", 3: " " },
      B: { 1: " ", 2: "O", 3: " " },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 6: -----------
  test("turn 6: user2 places O in B3", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user2 places O in B3
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "B", col: "3" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(6);
    expect(response.body.game.xPlacements).toEqual(["C3", "C1", "A2"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2", "B3"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: "X", 3: " " },
      B: { 1: " ", 2: "O", 3: "O" },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 7: ---------
  test("turn 7: user1 places X in B1", async () => {
    // generate token, logged in with user2;
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

    // user1 places X in B1
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "B", col: "1" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(7);
    expect(response.body.game.xPlacements).toEqual(["C3", "C1", "A2", "B1"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2", "B3"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: "X", 3: " " },
      B: { 1: "X", 2: "O", 3: "O" },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 8: ---------
  test("turn 8: user2 places O in A1", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user1 places X in B1
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "1" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(8);
    expect(response.body.game.xPlacements).toEqual(["C3", "C1", "A2", "B1"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2", "B3", "A1"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "O", 2: "X", 3: " " },
      B: { 1: "X", 2: "O", 3: "O" },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
    expect(response.body.game.finished).toBe(false);
    expect(response.body.game.winner).toHaveLength(0);
  });

  // TURN 9: --------- DRAW NO WINNERS --------
  test("turn 9: user1 places X in A3 -- DRAW", async () => {
    // generate token, logged in with user2;
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

    // user1 places X in A3
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "3" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(9);
    expect(response.body.game.xPlacements).toEqual([
      "C3",
      "C1",
      "A2",
      "B1",
      "A3",
    ]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2", "B3", "A1"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "O", 2: "X", 3: "X" },
      B: { 1: "X", 2: "O", 3: "O" },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
    // ADDITIONAL DRAW PROPERTIES:
    expect(response.body.game.finished).toBe(true);
    expect(response.body.game.winner).toHaveLength(2);
    expect(response.body.game.winner[0]).toMatchObject({
      _id: expect.any(String),
      username: "first_user123",
      points: 0,
    });
    expect(response.body.game.winner[1]).toMatchObject({
      _id: expect.any(String),
      username: "second_user123",
      points: 0,
    });
  });

  // GAME OVER-------- Try to play after game is over -- error ------------------
  test("turn 9+ & game over: user1 tries to play after the game is over", async () => {
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

    // user2 places X in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "2" });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("Game already finished.");
    expect(response.body.game.turn).toBe(9);
    expect(response.body.game.xPlacements).toEqual([
      "C3",
      "C1",
      "A2",
      "B1",
      "A3",
    ]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2", "B3", "A1"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "O", 2: "X", 3: "X" },
      B: { 1: "X", 2: "O", 3: "O" },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
    // ADDITIONAL DRAW PROPERTIES:
    expect(response.body.game.finished).toBe(true);
    expect(response.body.game.winner).toHaveLength(2);
    expect(response.body.game.winner[0]).toMatchObject({
      _id: expect.any(String),
      username: "first_user123",
      points: 0,
    });
    expect(response.body.game.winner[1]).toMatchObject({
      _id: expect.any(String),
      username: "second_user123",
      points: 0,
    });
  });
});

// =============== PLACE PIECE - GAMEPLAY TO FORFEIT - X FORFEITS, O WINS ================= //
describe("Gameplay with x-forfeit and o-win", () => {
  // this also checks for the 'already a piece there' and 'out of turn' error
  // this playthrough purposely sets the xPlacements in a certain order to test that the checkWins function tests of winning combinations in ANY order and as any portion of a longer xPlacements array.

  /* GAMEPLAY:
    turn 1: user1 places X in C3 (24 ms)
    turn 2: user1 tries to play again - out of turn error (15 ms)
    turn 2: user2 places O in C2 (16 ms)
    turn 3: user1 places X in C2 - occupied tile error (16 ms)
    turn 3: user1 places X in A1 (16 ms)
    turn 4: user2 places O in A2 (20 ms)
    turn 5: user1 forfeits
    turn 5 & game over: user1 tries to play after the game is over (13 ms)
  */

  // ---------------- ARRANGE: DB cleanup, create 3 Users & token, create a blank game with user1 and user2 -------------
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

    // create a game with user1 and user2
    game = new TicTacToe({ playerOne: user1._id, playerTwo: user2._id });
    await game.save();

    // get the id of the game;
    allGames = await TicTacToe.find();
    firstGame = allGames[0];
  });

  afterAll(async () => {
    await User.deleteMany({});
    await TicTacToe.deleteMany({});
  });

  // ------------- ACT & ASSERT GAMEPLAY: --------------------
  // TURN 1: -------------
  test("turn 1: user1 places X in C3", async () => {
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "3" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(1);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual([]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: " ", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 2: -----------
  test("turn 2: user1 tries to play again - out of turn error", async () => {
    // user1 still logged in:
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("It is not your turn.");
    expect(response.body.game.turn).toBe(1);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual([]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: " ", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  test("turn 2: user2 places O in C2", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user 2 places O in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(2);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 3: -----------
  test("turn 3: user1 places X in C2 - occupied tile error", async () => {
    // generate token, logged in with user2;
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

    // user 2 places O in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("Cannot place piece on occupied tile.");
    expect(response.body.game.turn).toBe(2);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  test("turn 3: user1 places X in A1", async () => {
    // user 1 places X in A1
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "1" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(3);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 4: -----------
  test("turn 4: user2 places O in A2", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user 2 places O in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "2" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(4);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "A2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "O", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 4-5: X FORFEITS, O WINS -----------
  test("turn 4-5: user1 forfeits - O WINS", async () => {
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

    // user1 places X in A3
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/forfeit`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(4);
    expect(response.body.game.xPlacements).toEqual(["C3", "A1"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "A2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "O", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
    // ADDITIONAL WIN PROPERTIES:
    expect(response.body.game.finished).toBe(true);
    expect(response.body.game.winner).toEqual([
      {
        _id: expect.any(String),
        username: "second_user123",
        points: 0,
      },
    ]);
  });
  // TODO add user updates to add points to user2

  // GAME OVER-------- Try to play after game is over -- error ------------------
  test("turn 4-5 & game over: user1 tries to play after the game is over", async () => {
    // generate token, logged in with user1;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user2 places X in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "2" });

    expect(response.statusCode).toBe(403);
    expect(response.body.game.turn).toBe(4);
    expect(response.body.error).toBe("Game already finished.");
    expect(response.body.game.xPlacements).toEqual(["C3", "A1"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "A2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "O", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
    // ADDITIONAL WIN PROPERTIES:
    expect(response.body.game.finished).toBe(true);
    expect(response.body.game.winner).toEqual([
      {
        _id: expect.any(String),
        username: "second_user123",
        points: 0,
      },
    ]);
  });
});

// =============== PLACE PIECE - GAMEPLAY TO CHECK DRAW ================= //
describe("Gameplay to turn 9 with x-win", () => {
  // this also checks for the 'already a piece there' and 'out of turn' error
  // this playthrough purposely sets the xPlacements in a certain order to test that the checkWins function tests of winning combinations in ANY order and as any portion of a longer xPlacements array.

  /* GAMEPLAY:
    turn 1: user1 places X in C3 (15 ms)
    turn 2: user1 tries to play again - out of turn error (12 ms)
    turn 2: user2 places O in C2 (14 ms)
    turn 3: user1 places X in C2 - occupied tile error (12 ms)
    turn 3: user1 places X in C1 (14 ms)
    turn 4: user2 places O in B2 (15 ms)
    turn 5: user1 places X in A2 (15 ms)
    turn 6: user2 places O in B3 (17 ms)
    turn 7: user1 places X in B1 (15 ms)
    turn 8: user2 places O in A3 (14 ms)
    turn 9: user1 places X in A1-- X WINS (25 ms)
    turn 9+ & game over: user1 tries to play after the game is over (13 ms)    
  */

  // ---------------- ARRANGE: DB cleanup, create 3 Users & token, create a blank game with user1 and user2 -------------
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

    // create a game with user1 and user2
    game = new TicTacToe({ playerOne: user1._id, playerTwo: user2._id });
    await game.save();

    // get the id of the game;
    allGames = await TicTacToe.find();
    firstGame = allGames[0];
  });

  afterAll(async () => {
    await User.deleteMany({});
    await TicTacToe.deleteMany({});
  });

  // ------------- ACT & ASSERT GAMEPLAY: --------------------
  // TURN 1: -------------
  test("turn 1: user1 places X in C3", async () => {
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "3" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(1);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual([]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: " ", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 2: -----------
  test("turn 2: user1 tries to play again - out of turn error", async () => {
    // user1 still logged in:
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("It is not your turn.");
    expect(response.body.game.turn).toBe(1);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual([]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: " ", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  test("turn 2: user2 places O in C2", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user 2 places O in C2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(2);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 3: -----------
  test("turn 3: user1 places X in C2 - occupied tile error", async () => {
    // generate token, logged in with user2;
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

    // user 2 places O in C2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "2" });
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("Cannot place piece on occupied tile.");
    expect(response.body.game.turn).toBe(2);
    expect(response.body.game.xPlacements).toEqual(["C3"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: " ", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  test("turn 3: user1 places X in C1", async () => {
    // user 1 places X in C1
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "C", col: "1" });
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(3);
    expect(response.body.game.xPlacements).toEqual(["C3", "C1"]);
    expect(response.body.game.oPlacements).toEqual(["C2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: " ", 3: " " },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 4: -----------
  test("turn 4: user2 places O in B2", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user 2 places O in B2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "B", col: "2" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(4);
    expect(response.body.game.xPlacements).toEqual(["C3", "C1"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: " ", 3: " " },
      B: { 1: " ", 2: "O", 3: " " },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 5: -----------
  test("turn 5: user1 places X in A2", async () => {
    // generate token, logged in with user2;
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

    // user1 places X in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "2" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(5);
    expect(response.body.game.xPlacements).toEqual(["C3", "C1", "A2"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: "X", 3: " " },
      B: { 1: " ", 2: "O", 3: " " },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 6: -----------
  test("turn 6: user2 places O in B3", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user2 places O in B3
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "B", col: "3" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(6);
    expect(response.body.game.xPlacements).toEqual(["C3", "C1", "A2"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2", "B3"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: "X", 3: " " },
      B: { 1: " ", 2: "O", 3: "O" },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 7: ---------
  test("turn 7: user1 places X in B1", async () => {
    // generate token, logged in with user2;
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

    // user1 places X in B1
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "B", col: "1" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(7);
    expect(response.body.game.xPlacements).toEqual(["C3", "C1", "A2", "B1"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2", "B3"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: "X", 3: " " },
      B: { 1: "X", 2: "O", 3: "O" },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
  });
  // TURN 8: ---------
  test("turn 8: user2 places O in A3", async () => {
    // generate token, logged in with user2;
    token = JWT.sign(
      {
        user_id: user2.id,
        // Backdate this token of 5 minutes
        iat: Math.floor(Date.now() / 1000) - 5 * 60,
        // Set the JWT token to expire in 10 minutes
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      secret
    );

    // user2 places O in A3
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "3" });

    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(8);
    expect(response.body.game.xPlacements).toEqual(["C3", "C1", "A2", "B1"]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2", "B3", "A3"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: " ", 2: "X", 3: "O" },
      B: { 1: "X", 2: "O", 3: "O" },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
    expect(response.body.game.finished).toBe(false);
    expect(response.body.game.winner).toHaveLength(0);
  });

  // TURN 9: --------- DRAW NO WINNERS --------
  test("turn 9: user1 places X in A1-- X WINS", async () => {
    // generate token, logged in with user2;
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

    // user1 places X in A1
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "1" });

    console.log(response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body.game.turn).toBe(9);
    expect(response.body.game.xPlacements).toEqual([
      "C3",
      "C1",
      "A2",
      "B1",
      "A1",
    ]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2", "B3", "A3"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "X", 3: "O" },
      B: { 1: "X", 2: "O", 3: "O" },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
    // ADDITIONAL WIN PROPERTIES:
    expect(response.body.game.finished).toBe(true);
    expect(response.body.game.winner).toHaveLength(1);
    expect(response.body.game.winner).toEqual([
      {
        _id: expect.any(String),
        username: "first_user123",
        points: 0,
      },
    ]);
  });

  // GAME OVER-------- Try to play after game is over -- error ------------------
  test("turn 9+ & game over: user1 tries to play after the game is over", async () => {
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

    // user2 places X in A2
    response = await request(app)
      .put(`/tictactoe/${firstGame._id}/place_piece`)
      .set("Authorization", `Bearer ${token}`)
      .send({ row: "A", col: "2" });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("Game already finished.");
    expect(response.body.game.turn).toBe(9);
    expect(response.body.game.xPlacements).toEqual([
      "C3",
      "C1",
      "A2",
      "B1",
      "A1",
    ]);
    expect(response.body.game.oPlacements).toEqual(["C2", "B2", "B3", "A3"]);
    expect(response.body.game.gameBoard).toEqual({
      A: { 1: "X", 2: "X", 3: "O" },
      B: { 1: "X", 2: "O", 3: "O" },
      C: { 1: "X", 2: "O", 3: "X" },
    });
    expect(response.body.token).toBeDefined();
    // ADDITIONAL WIN PROPERTIES:
    expect(response.body.game.finished).toBe(true);
    expect(response.body.game.winner).toHaveLength(1);
    expect(response.body.game.winner).toEqual([
      {
        _id: expect.any(String),
        username: "first_user123",
        points: 0,
      },
    ]);
  });
});
