const app = require("../../../app");
const request = require("supertest");
require("../../mongodb_helper");
const Battleships = require('../../../models/battleships');
const User = require('../../../models/user');
const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;


// ==================== FIND BY ID -- with conceal function ==================================== //
describe(".FINDBYID - /battleships/:gameID ", () => {
  
  // ----------- DECLARE VARIABLES -----------------
  let token;
  let user;
  let user2;
  let game1;
  let response;
  let firstGame;
  let allGames;

  const playedBoard = [
    ["","","","","","","","","","",],
    ["","s","","","","","","","","",],
    ["","s","","","","","","","","",],
    ["","","","","","","","","","",],
    ["","s","s","s","","","","","","",],
    ["","","","","","","","","","",],
    ["","","","","","","","X","","",],
    ["","","","","","","","","","S",],
    ["","","","","","O","O","O","","",],
    ["","","","","","","","","S","",],
  ]
  const concealedBoard = [
    ["","","","","","","","","","",],
    ["","","","","","","","","","",],
    ["","","","","","","","","","",],
    ["","","","","","","","","","",],
    ["","","","","","","","","","",],
    ["","","","","","","","","","",],
    ["","","","","","","","X","","",],
    ["","","","","","","","","","S",],
    ["","","","","","O","O","O","","",],
    ["","","","","","","","","S","",],
  ]
  const unplacedShips = { 
    carrier: { sank_status: false, units: [] },
    battleship: { sank_status: false, units: [] },
    cruiser: { sank_status: false, units: [] },
    submarine: { sank_status: false, units: [] },
    destroyer: { sank_status: false, units: [] },
  }

  // ----------- ARRANGE: DB SETUP/CLEANUP, CREATE USER, & TOKEN -----------------
  beforeAll(async () => {
    // create a user
    user = new User({ email: "test@test.com", username: "user123", password: "12345678" });
    await user.save();
    // create a second user
    user2 = new User({ email: "test2@test.com", username: "seconduser123", password: "123456789" });
    await user2.save();
    
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


  // ==================================================================================
  // -------------- FIND BY ID WITH TOKEN, sessionUser is playerOne. ------------------
  describe("When a token is present & the sessionUser is playerOne", () => {
    

    // search games with a token
    beforeEach(async () => {
      // create game
      game1 = new Battleships({playerOne: user._id, playerOneBoard: playedBoard, playerTwoBoard: playedBoard}) // conceal playerTwoBoard when user is viewing the game.
      await game1.save();

      // get all games and find the id of the first game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/battleships/${firstGame._id}`)
        .set('Authorization', `Bearer ${token}`)

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
        playerOneBoard: playedBoard, // logged in user
        playerTwoBoard: concealedBoard // opponent
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

  // -------------- FIND BY ID WITH TOKEN, sessionUser is playerTwo. ------------------
  describe("When a token is present & the sessionUser is playerOne", () => {
    let response;
    let firstGame;
    let allGames;
    const playedBoard = [
      ["","","","","","","","","","",],
      ["","s","","","","","","","","",],
      ["","s","","","","","","","","",],
      ["","","","","","","","","","",],
      ["","s","s","s","","","","","","",],
      ["","","","","","","","","","",],
      ["","","","","","","","X","","",],
      ["","","","","","","","","","S",],
      ["","","","","","O","O","O","","",],
      ["","","","","","","","","S","",],
    ]
    const concealedBoard = [
      ["","","","","","","","","","",],
      ["","","","","","","","","","",],
      ["","","","","","","","","","",],
      ["","","","","","","","","","",],
      ["","","","","","","","","","",],
      ["","","","","","","","","","",],
      ["","","","","","","","X","","",],
      ["","","","","","","","","","S",],
      ["","","","","","O","O","O","","",],
      ["","","","","","","","","S","",],
    ]

    // search games with a token
    beforeEach(async () => {
      // create game
      game1 = new Battleships({playerOne: user2._id, playerTwo: user._id, playerOneBoard: playedBoard, playerTwoBoard: playedBoard}) // conceal playerTwoBoard when user is viewing the game.
      await game1.save();

      // get all games and find the id of the first game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/battleships/${firstGame._id}`)
        .set('Authorization', `Bearer ${token}`)

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
        playerOneBoard: concealedBoard, // opponent
        playerTwoBoard: playedBoard // logged in user
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
      game1 = new Battleships({playerOne: user._id})
      game2 = new Battleships({playerOne: user._id})
      await game1.save();
      await game2.save();

      // get all games and find the id of the first game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/battleships/${fakeGameID}`)
        .set('Authorization', `Bearer ${token}`)

    });

    // --------- ASSERTIONS -----------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a battleships object with a populated playerOne", () => {
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
      game1 = new Battleships({playerOne: user._id})
      game2 = new Battleships({playerOne: user._id})
      await game1.save();
      await game2.save();

      // get all games and find the id of the first game
      allGames = await Battleships.find();
      firstGame = allGames[0];

      // fetch by gameID
      response = await request(app)
        .get(`/battleships/${firstGame._id}`)
    });

    // --------- ASSERTIONS -----------
    test("responds with a 401", async () => {
      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({"message": "auth error"});
    });
    test("does not return a game object", () => {
      expect(response.body.game).toEqual(undefined);
    })
    test("does not generate a new token", async () => {
      expect(response.body.token).toEqual(undefined);
    });
  })
})

