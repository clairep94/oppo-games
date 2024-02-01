const app = require("../../../app");
const request = require("supertest");
require("../../mongodb_helper");
const Battleships = require('../../../models/battleships');
const User = require('../../../models/user');
const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

// ---------- DECLARE VARIABLES --------------  
let token;
let user;
let game1;
let game2;
const emptyBoard = [
  ["","","","","","","","","","",],
  ["","","","","","","","","","",],
  ["","","","","","","","","","",],
  ["","","","","","","","","","",],
  ["","","","","","","","","","",],
  ["","","","","","","","","","",],
  ["","","","","","","","","","",],
  ["","","","","","","","","","",],
  ["","","","","","","","","","",],
  ["","","","","","","","","","",],
];
const unplacedShips = { 
  carrier: { sank_status: false, units: [] },
  battleship: { sank_status: false, units: [] },
  cruiser: { sank_status: false, units: [] },
  submarine: { sank_status: false, units: [] },
  destroyer: { sank_status: false, units: [] },
};  



// ==================== CREATE A GAME ================================= //
describe("CREATE - /battleships", () => {


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
    await Battleships.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Battleships.deleteMany({});
  });

  // --------------------------- CREATE WITH A TOKEN --------------------------- //
  describe("When token is present", () => {
    let response;

    // ---------------- ACT: create game with a token; ------------- 
    beforeEach(async () => {
      response = await request(app)
        .post("/battleships") // Correct endpoint
        .set("Authorization", `Bearer ${token}`)
        .send({ playerOne: user._id });
    });

    // --------- ASSERT: Response code 201, returns a token & populated game -----------
    test("responds with a 201", async () => {
      expect(response.statusCode).toBe(201);
    });
    test("returns a battleships object with a populated playerOne", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "user123",
          points: 0
        },
        title: "Battleships",
        endpoint: "battleships",
        turn: 0,
        winner: [],
        finished: false,
        
        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: unplacedShips,
        playerTwoShips: unplacedShips,
        playerOneBoard: emptyBoard,
        playerTwoBoard: emptyBoard
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
        .post("/battleships") 
        .send({ playerOne: user._id });
    });

    // --------- ASSERT: Response code 401, returns no token & no populated game -----------
    test("responds with a 401 & auth error message", async () => {
      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({"message": "auth error"});
    });
    test("does not create a game", async () => {
      let games = await Battleships.find()
      expect(games.length).toEqual(0);
    })
    test("returns no new token", async () => {
      expect(response.body.token).toEqual(undefined);    
    });
  });

});


// ==================== INDEX ========================================== //
describe("INDEX - /battleships", () => {
  
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
    await Battleships.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Battleships.deleteMany({});
  });

  // ------------------ INDEX WITH TOKEN --------------------- //
  describe("When a token is present", () => {
    let response;

    beforeEach(async () => {
      // -------- ARRANGE: create 2 games -------------
      game1 = new Battleships({playerOne: user._id})
      game2 = new Battleships({playerOne: user._id})
      await game1.save();
      await game2.save();

      // ------ ACT: fetch all games with a token -------------
      response = await request(app)
        .get("/battleships") 
        .set("Authorization", `Bearer ${token}`)
    });

    // ------- ASSERT: Response code 200, returns an array of Battleships populated games, and a new token -----
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns an array of battleships object with a populated playerOne", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "user123",
          points: 0
        },
        title: "Battleships",
        endpoint: "battleships",
        turn: 0,
        winner: [],
        finished: false,

        // === BATTLESHIP PROPERTIES ====== //
        playerOneShips: unplacedShips,
        playerTwoShips: unplacedShips,
        playerOneBoard: emptyBoard,
        playerTwoBoard: emptyBoard
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
        .get("/battleships") // Correct endpoint
        .set("Authorization", `Bearer ${token}`)
        .send({ playerOne: user._id });
    });

    // --------- ASSERT: Response code 200, returns empty array and new token -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns an empty array of battleships object with a populated playerOne", () => {
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
      game1 = new Battleships({playerOne: user._id})
      game2 = new Battleships({playerOne: user._id})
      await game1.save();
      await game2.save();

      // ------ ACT: search games with no token ---------
      response = await request(app)
        .get("/battleships") 
    });

    // --------- ASSERT: status 401, return no games and no token -----------
    test("responds with a 401 & auth error message", async () => {
      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({"message": "auth error"});
    });
    test("does not return any games", () => {
      expect(response.body.games).toEqual(undefined);
    })
    test("generates a new token", async () => {
      expect(response.body.token).toEqual(undefined);
    });
  })
})