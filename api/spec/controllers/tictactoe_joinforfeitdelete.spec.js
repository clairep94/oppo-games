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


// ==================== JOIN ========================================= //
describe("JOIN - /tictactoe/:gameID/join ", () => {
  let user1;
  let user2;
  let game;
  let allGames;

  beforeAll(async () => {
    // create a user
    user1 = new User({ email: "test@test.com", username: "user123", password: "12345678" });
    await user1.save();
    user2 = new User({ email: "otherUser@test.com", username: "secondUser123", password: "12345678" });
    await user2.save();

    // generate token
    token = JWT.sign({
      user_id: user1.id,
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

  // -------------- JOIN WITH TOKEN & NO ERRORS -------------------
  describe("When a token is present and no errors", () => {
    let response;

    // create a game where logged in user is not playerOne and playerTwo is empty
    beforeEach(async () => {
      game = new TicTacToe({playerOne: user2._id})
      await game.save();

      // get the id of the game;
      allGames = await TicTacToe.find();
      firstGame = allGames[0];
      // make the put request;
      response = await request(app)
        .put(`/tictactoe/${firstGame._id}/join`)
        .set('Authorization', `Bearer ${token}`)
        // .send()
    });

    // ---------- ASSERTIONS: ------------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a tictactoe object with a populated playerOne", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "secondUser123",
          points: 0
        },
        playerTwo: {
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
  // -------------- JOIN WITH TOKEN & GAME ALREADY FULL -------------------
  describe("When a token is present but game is already full", () => {
    let response;

    // create a game where playerOne and playerTwo are already filled
    beforeEach(async () => {
      game = new TicTacToe({playerOne: user2._id, playerTwo: user1._id})
      await game.save();

      // get the id of the game;
      allGames = await TicTacToe.find();
      firstGame = allGames[0];
      // make the put request;
      response = await request(app)
        .put(`/tictactoe/${firstGame._id}/join`)
        .set('Authorization', `Bearer ${token}`)
    });

    // ---------- ASSERTIONS: ------------
    test("responds with a 403 and an error message", async () => {
      expect(response.statusCode).toBe(403);
      // expect(response.body.error).toBe()
    });
    test("returns a tictactoe object with a populated playerOne", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "secondUser123",
          points: 0
        },
        playerTwo: {
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
  // -------------- JOIN WITH TOKEN & ALREADY IN THE GAME -------------------
  // -------------- JOIN WITH TOKEN & GAME NOT FOUND -------------------
  // -------------- JOIN WITH NO TOKEN ----------------------
  describe("When not token is present", () => {
    let response;

    beforeEach(async () => {
      game = new TicTacToe({playerOne: user2._id})
      await game.save();

      // get the id of the game;
      allGames = await TicTacToe.find();
      firstGame = allGames[0];
      // make the put request;
      response = await request(app)
        .put(`/tictactoe/${firstGame._id}/join`)
        // .set('Authorization', `Bearer ${token}`)
        // .send()
    });

    // --------- ASSERTIONS -----------
    test("responds with a 401", async () => {
      expect(response.statusCode).toBe(401);
    });
    test("does not return a tictactoe game object", () => {
      expect(response.body.game).toEqual(undefined);
    })
    test("does not generate a new token", async () => {
      expect(response.body.token).toEqual(undefined);
    });
  })
})


// ==================== FORFEIT ===============================
describe("/tictactoe/:gameID/forfeit, FORFEIT", () => {
  // -------------- FORFEIT WITH TOKEN & NO ERRORS -------------------
  // -------------- FORFEIT WITH TOKEN & GAME ALREADY FINISHED -------------------
  // -------------- FORFEIT WITH TOKEN & GAME NOT FOUND -------------------
  // -------------- FORFEIT WITH NO TOKEN ----------------------
})

// ==================== DELETE ================================
// describe("/tictactoe/:gameID/delete, DELETE", () => {
//   // -------------- DELETE WITH TOKEN & NO ERRORS -------------------
//   // -------------- DELETE WITH TOKEN & GAME ALREADY FULL -------------------
//   // -------------- DELETE WITH TOKEN & GAME NOT FOUND -------------------
//   // -------------- DELETE WITH NO TOKEN ----------------------
// })

// ==================== PLACE PIECE ===========================
// See tictactoe_gameplay.spec.js for gameplay testing
// describe("/tictactoe/:gameID/place_piece, JOIN", () => {
//   // -------------- JOIN WITH TOKEN & NO ERRORS -------------------
//   // -------------- JOIN WITH TOKEN & GAME ALREADY FULL -------------------
//   // -------------- JOIN WITH TOKEN & GAME NOT FOUND -------------------
//   // -------------- JOIN WITH NO TOKEN ----------------------
// })