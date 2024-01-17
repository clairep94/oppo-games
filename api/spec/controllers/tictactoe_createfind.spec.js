const app = require("../../app");
const request = require("supertest");
require("../mongodb_helper");
const TicTacToe = require('../../models/tictactoe');
const User = require('../../models/user');
const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

let token;

// ==================== CREATE A GAME ================================= //
describe("CREATE - /tictactoe", () => {
  let user;
  
  // ---------------- ARRANGE: DB cleanup, create User & token ------------- //
  beforeAll(async () => {
    // create a user
    user = new User({ email: "test@test.com", username: "user123", password: "12345678" });
    await user.save();

    // generate token
    token = JWT.sign({
      user_id: user.id,
      // Backdate this token of 5 minutes
      iat: Math.floor(Date.now() / 1000) - (5 * 60),
      // Set the JWT token to expire in 10 minutes
      exp: Math.floor(Date.now() / 1000) + (10 * 60),
    }, secret);
  });

  beforeEach(async () => {
    // reset database;
    await TicTacToe.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await TicTacToe.deleteMany({});
  });

  // --------------------------- CREATE WITH A TOKEN --------------------------- //
  describe("When token is present", () => {
    let response;

    // ---------------- ACT: create game with a token; ------------- 
    beforeEach(async () => {
      response = await request(app)
        .post("/tictactoe") // Correct endpoint
        .set("Authorization", `Bearer ${token}`)
        .send({ playerOne: user._id });
    });

    // --------- ASSERT: Response code 201, returns a token & populated game -----------
    test("responds with a 201", async () => {
      expect(response.statusCode).toBe(201);
    });
    test("returns a tictactoe object with a populated playerOne", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "user123",
          points: 0
        },
        title: "Tic-Tac-Toe",
        endpoint: "tictactoe",
        turn: 0,
        winner: [],
        finished: false,
        xPlacements: [],
        oPlacements: [],
        gameBoard: {
          A: { 1: " ", 2: " ", 3: " " },
          B: { 1: " ", 2: " ", 3: " " },
          C: { 1: " ", 2: " ", 3: " " },
          
      },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    })
    test("generates a new token", async () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  });

  // --------------------------- CREATE NO TOKEN - ERROR --------------------------- //
  describe("When no token is present", () => {
    let response;

    // ---------------- ACT: create game with no token; -------------
    beforeEach(async () => {
      response = await request(app)
        .post("/tictactoe") 
        .send({ playerOne: user._id });
    });

    // --------- ASSERT: Response code 401, returns no token & no populated game -----------
    test("responds with a 401", async () => {
      expect(response.statusCode).toBe(401);
    });
    test("does not create a game", async () => {
      let games = await TicTacToe.find()
      expect(games.length).toEqual(0);
      // expect(response.body).toEqual({"message": "auth error"});
    })
    test("returns no new token", async () => {
      expect(response.body.token).toEqual(undefined);    
    });
  });

});


// ==================== INDEX ========================================== //
describe("INDEX - /tictactoe", () => {
  let user;
  let game1;
  let game2;
  // -------- ARRANGE: DB cleanup, create User & token ----------
  beforeAll(async () => {
    // create a user
    user = new User({ email: "test@test.com", username: "user123", password: "12345678" });
    await user.save();

    // generate token
    token = JWT.sign({
      user_id: user.id,
      // Backdate this token of 5 minutes
      iat: Math.floor(Date.now() / 1000) - (5 * 60),
      // Set the JWT token to expire in 10 minutes
      exp: Math.floor(Date.now() / 1000) + (10 * 60),
    }, secret);
  });

  beforeEach(async () => {
    // reset database;
    await TicTacToe.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await TicTacToe.deleteMany({});
  });

  // ------------------ INDEX WITH TOKEN --------------------- //
  describe("When a token is present", () => {
    let response;

    beforeEach(async () => {
      // -------- ARRANGE: create 2 games -------------
      game1 = new TicTacToe({playerOne: user._id})
      game2 = new TicTacToe({playerOne: user._id})
      await game1.save();
      await game2.save();

      // ------ ACT: fetch all games with a token -------------
      response = await request(app)
        .get("/tictactoe") 
        .set("Authorization", `Bearer ${token}`)
    });

    // ------- ASSERT: Response code 200, returns an array of TTT populated games, and a new token -----
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns an array of tictactoe object with a populated playerOne", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "user123",
          points: 0
        },
        title: "Tic-Tac-Toe",
        endpoint: "tictactoe",
        turn: 0,
        winner: [],
        finished: false,
        xPlacements: [],
        oPlacements: [],
        gameBoard: {
          A: { 1: " ", 2: " ", 3: " " },
          B: { 1: " ", 2: " ", 3: " " },
          C: { 1: " ", 2: " ", 3: " " },
          
      },
      };
      expect(response.body.games).toHaveLength(2);
      expect(response.body.games[0]).toMatchObject(expectedResponse);
      expect(response.body.games[1]).toMatchObject(expectedResponse);
    })
    test("generates a new token", async () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  })

  // ------------- INDEX WITH TOKEN AND EMPTY LIST ------------- //
  describe("When a token is present but the array is empty", () => {
    let response;

    // ------ ACT: search games with a token ---------
    beforeEach(async () => {
      response = await request(app)
        .get("/tictactoe") // Correct endpoint
        .set("Authorization", `Bearer ${token}`)
        .send({ playerOne: user._id });
    });

    // --------- ASSERT: Response code 200, returns empty array and new token -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns an empty array of tictactoe object with a populated playerOne", () => {
      expect(response.body.games).toHaveLength(0);
    })
    test("generates a new token", async () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  })

  // ------------- INDEX WITH NO TOKEN - ERROR ------------- //
  describe("When no token is present", () => {
    let response;

    beforeEach(async () => {
      // ------ ARRANGE: create 2 games -------
      game1 = new TicTacToe({playerOne: user._id})
      game2 = new TicTacToe({playerOne: user._id})
      await game1.save();
      await game2.save();

      // ------ ACT: search games with no token ---------
      response = await request(app)
        .get("/tictactoe") 
    });

    // --------- ASSERT: status 401, return no games and no token -----------
    test("responds with a 401", async () => {
      expect(response.statusCode).toBe(401);
    });
    test("does not return any games", () => {
      expect(response.body.games).toEqual(undefined);
    })
    test("generates a new token", async () => {
      expect(response.body.token).toEqual(undefined);
    });
  })
})


// ==================== FIND BY ID ==================================== //
describe(".FINDBYID - /tictactoe/:gameID ", () => {
  let user;
  let game1;
  let game2;

  beforeAll(async () => {
    // create a user
    user = new User({ email: "test@test.com", username: "user123", password: "12345678" });
    await user.save();

    // generate token
    token = JWT.sign({
      user_id: user.id,
      // Backdate this token of 5 minutes
      iat: Math.floor(Date.now() / 1000) - (5 * 60),
      // Set the JWT token to expire in 10 minutes
      exp: Math.floor(Date.now() / 1000) + (10 * 60),
    }, secret);
  });

  beforeEach(async () => {
    // reset database;
    await TicTacToe.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await TicTacToe.deleteMany({});
  });

  // -------------- FIND BY ID WITH TOKEN ------------------
  describe("When a token is present", () => {
    let response;
    let firstGame;
    let allGames;

    // search games with a token
    beforeEach(async () => {
      // create 2 games
      game1 = new TicTacToe({playerOne: user._id})
      game2 = new TicTacToe({playerOne: user._id})
      await game1.save();
      await game2.save();

      // get all games and find the id of the first game
      allGames = await TicTacToe.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/tictactoe/${firstGame._id}`)
        .set('Authorization', `Bearer ${token}`)

    });

    // --------- ASSERTIONS -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a tictactoe object with a populated playerOne", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "user123",
          points: 0
        },
        title: "Tic-Tac-Toe",
        endpoint: "tictactoe",
        turn: 0,
        winner: [],
        finished: false,
        xPlacements: [],
        oPlacements: [],
        gameBoard: {
          A: { 1: " ", 2: " ", 3: " " },
          B: { 1: " ", 2: " ", 3: " " },
          C: { 1: " ", 2: " ", 3: " " },
          
      },
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    })
    test("generates a new token", async () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  })

  // ------------- FIND BY ID WITH NO RESULT ------------------
  describe("When a token is present but no matching ID", () => {
    let response;
    let firstGame;
    let allGames;
    const fakeGameID = "65a5303a0aaf4a563f531d92";

    // search games with a token
    beforeEach(async () => {
      // create 2 games
      game1 = new TicTacToe({playerOne: user._id})
      game2 = new TicTacToe({playerOne: user._id})
      await game1.save();
      await game2.save();

      // get all games and find the id of the first game
      allGames = await TicTacToe.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/tictactoe/${fakeGameID}`)
        .set('Authorization', `Bearer ${token}`)

    });

    // --------- ASSERTIONS -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a tictactoe object with a populated playerOne", () => {
      expect(response.body.game).toEqual(null);
    })
    test("generates a new token", async () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  })

  // ------------- WHEN NO TOKEN --------------------
  describe("When not token is present", () => {
    let response;

    // search games with a token
    beforeEach(async () => {
      // create 2 games
      game1 = new TicTacToe({playerOne: user._id})
      game2 = new TicTacToe({playerOne: user._id})
      await game1.save();
      await game2.save();

      // get all games and find the id of the first game
      allGames = await TicTacToe.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/tictactoe/${firstGame._id}`)
        // .set('Authorization', `Bearer ${token}`)

    });

    // --------- ASSERTIONS -----------
    test("responds with a 401", async () => {
      expect(response.statusCode).toBe(401);
    });
    test("does not return a game object", () => {
      expect(response.body.game).toEqual(undefined);
    })
    test("does not generate a new token", async () => {
      expect(response.body.token).toEqual(undefined);
    });
  })
})

