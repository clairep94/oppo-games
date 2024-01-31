const app = require("../../../app");
const request = require("supertest");
require("../../mongodb_helper");
const Battleships = require('../../../models/battleships');
const User = require('../../../models/user');
const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

// initialise re-used variables
let token;
let user1;
let user2;
let user3;
let game;
let response;

// For edgecases with a token, I will check only the cases where they would be the most harmful/malicious. 
// The rest will be handled by FE conditional rendering of buttons.

// TODO FORFEIT & DELETE RULES FOR BATTLESHIPS
// Forfeit - cannot forfeit when ships are not placed -- delete instead?

// ============================= JOIN ========================================= //
describe("JOIN - /battleships/:gameID/join ", () => {

  // ---------------- ARRANGE: DB cleanup, create 3 Users & token ------------- //
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
    await Battleships.deleteMany({});
  });
  afterAll(async () => {
    await User.deleteMany({});
    await Battleships.deleteMany({});
  });

  // ---------------------- JOIN AN OPEN GAME WITH A TOKEN --------------------------- //
  describe("When a token is present and no errors", () => {

    // ------ ARRANGE: create a game where logged in user is not playerOne and playerTwo is empty -------
    beforeEach(async () => {
      game = new Battleships({playerOne: user2._id}) // playerOne: user2; playerTwo is empty
      await game.save();

      // get the id of the game;
      allGames = await Battleships.find();
      firstGame = allGames[0];

    // ------ ACT: user1 makes the put request to join ---------
      response = await request(app)
        .put(`/battleships/${firstGame._id}/join`)
        .set('Authorization', `Bearer ${token}`)
    });

    // ---------- ASSERT: response code 200, return game with user1 is added as playerTwo && valid token ------------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a battleships object with a populated playerOne", () => {
      const expectedResponse = {
        playerOne: {
          _id: expect.any(String),
          username: "second_user123",
          points: 0
        },
        playerTwo: {
          _id: expect.any(String),
          username: "first_user123",
          points: 0
        },
        title: "Battleships",
        endpoint: "battleships",
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

  // -------------- JOIN WITH TOKEN & GAME ALREADY FULL ------------------- //
  describe("When a token is present but game is already full", () => {

    // ----- ARRANGE: create a game where playerOne and playerTwo are already filled ---------
    beforeEach(async () => {
      game = new Battleships({playerOne: user2._id, playerTwo: user3._id})
      await game.save();

      // get the id of the game;
      allGames = await Battleships.find();
      firstGame = allGames[0];


    // ------ ACT: make the put request for user1 to join -------------
      response = await request(app)
        .put(`/battleships/${firstGame._id}/join`)
        .set('Authorization', `Bearer ${token}`)
    });

    // ---------- ASSERTIONS: ------------
    test("responds with a 403", async () => {
      expect(response.statusCode).toBe(403);
      // expect(response.body.error).toBe()
    });
    test("returns the original battleships game", () => {
      const expectedResponse = {
        playerOne: { //user2
          _id: expect.any(String),
          username: "second_user123",
          points: 0
        },
        playerTwo: { //user1
          _id: expect.any(String),
          username: "third_user123",
          points: 0
        },
        title: "Battleships",
        endpoint: "battleships",
        turn: 0,
        winner: [],
        finished: false,
        //TODO BS PROPERTIES
      };
      expect(response.body.game).toMatchObject(expectedResponse);
    })
    test("contains an error message", () => {
      expect(response.body.error).toBe("Game already full.");
    })
    test("generates a new token", async () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  }); 

  // -------------- JOIN WITH NO TOKEN ----------------------
  describe("When not token is present", () => {

    // ------- ARRANGE: create an open game user2 ---------
    beforeEach(async () => {
      game = new Battleships({playerOne: user2._id})
      await game.save();

      // get the id of the game;
      allGames = await Battleships.find();
      firstGame = allGames[0];

    // ------- ACT: user1 joins without a token ------------
      response = await request(app)
        .put(`/battleships/${firstGame._id}/join`)
    });

    // --------- ASSERTIONS -----------
    test("responds with a 401", async () => {
      expect(response.statusCode).toBe(401);
    });
    test("does not return a battleships game object", () => {
      expect(response.body.game).toEqual(undefined);
    })
    test("does not generate a new token", async () => {
      expect(response.body.token).toEqual(undefined);
    });
  })

  // The following cases are controlled in the Front-end -- buttons will appear conditionally.
  // -------------- JOIN WITH TOKEN & ALREADY IN THE GAME -------------------
  // -------------- JOIN WITH TOKEN & GAME NOT FOUND -------------------
})


// ============================== FORFEIT ====================================== //
describe("/battleships/:gameID/forfeit, FORFEIT", () => {

  // ---------------- ARRANGE: DB cleanup, create 3 Users & token ------------- //
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
    await Battleships.deleteMany({});
  });
  afterAll(async () => {
    await User.deleteMany({});
    await Battleships.deleteMany({});
  });

  // -------------- FORFEIT WITH TOKEN & NO ERRORS ------------------------- //
  // TODO change this to increase other player's user points --> write to user model && battleships model
  describe("When a token is present and no errors (sessionUser in game && playerTwo exists && !finished)", () => {

    // ------- ARRANGE: create a game with user1 and user2, and game.finished = false ---------
    beforeEach(async() => {
      game = new Battleships({ playerOne: user1._id, playerTwo: user2._id })
      await game.save()

      // get id of the created game:
      allGames = await Battleships.find();
      firstGame = allGames[0];

    // ------- ACT: user1 forfeits ----------------
      response = await request(app)
        .put(`/battleships/${firstGame._id}/forfeit`)
        .set('Authorization', `Bearer ${token}`)
    });

    // ---------- ASSERT: response code 200, return game with finished=true, winner=[user2] && valid token ------------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    });
    test("returns a battleships object with a populated playerOne", () => {
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
        title: "Battleships",
        endpoint: "battleships",
        turn: 0,
        winner: [
          { // user2 wins
            _id: expect.any(String),
            username: "second_user123",
            points: 0
          }
        ],
        finished: true,
        //TODO BS PROPERTIES
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

  // -------------- FORFEIT WITH TOKEN & NOT PART OF GAME -------------------
  describe("When token is present, but sessionUser is not playerOne or playerTwo", () => {

    // ------- ARRANGE: create a game with user2 and user3, and game.finished = false ---------
    beforeEach(async() => {
      game = new Battleships({ playerOne: user2._id, playerTwo: user3._id })
      await game.save()

      // get id of the created game:
      allGames = await Battleships.find();
      firstGame = allGames[0];

    // ------- ACT: user1 forfeits ----------------
      response = await request(app)
        .put(`/battleships/${firstGame._id}/forfeit`)
        .set('Authorization', `Bearer ${token}`)
    });
    // ---------- ASSERT: response code 403, error message, return the original game, original game has not changed ------------
    test("responds with a 403", async () => {
      expect(response.statusCode).toBe(403);
    });
    test("responds an error message 'Only players can forfeit the game'", async () => {
      expect(response.body.error).toBe('Only players can forfeit the game.');
    });
    test("returns the original TTT game", () => {
      // comparing with expectedResponse not working, so comparing manually:
      expect(response.body.game.playerOne.username).toBe("second_user123")
      expect(response.body.game.playerTwo.username).toBe("third_user123")
      expect(response.body.game.winner).toEqual([]);
      expect(response.body.game.finished).toBe(false);
      expect(response.body.game.turn).toBe(0);
      //TODO BS PROPERTIES
      });
    test("the original game does not change", async () => {
      const checkGame = await Battleships.findById(game._id)
        .populate('playerOne', '_id username points')
        .populate('playerTwo', '_id username points')
        .populate('winner', '_id username points');

      // comparing with expectedResponse not working, so comparing manually:
      expect(checkGame.playerOne.username).toBe('second_user123')
      expect(checkGame.playerTwo.username).toBe("third_user123")
      expect(checkGame.winner).toHaveLength(0);
      expect(checkGame.finished).toBe(false);
      expect(checkGame.turn).toBe(0);
      //TODO BS PROPERTIES
      })
    test("generates a new token", async () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  })


  // -------------- FORFEIT WITH NO TOKEN --------------------------------- //
  describe("When not token is present", () => {
    let response;
    
    // ------- ARRANGE: create a game with user1 and user2, and game.finished = false ---------
    beforeEach(async() => {
      game = new Battleships({ playerOne: user1._id, playerTwo: user2._id })
      await game.save()

      // get id of the created game:
      allGames = await Battleships.find();
      firstGame = allGames[0];

    // ------- ACT: user1 forfeits without a token ----------------
      response = await request(app)
        .put(`/battleships/${firstGame._id}/forfeit`)
    });

    // --------- ASSERTIONS -----------
    test("responds with a 401", async () => {
      expect(response.statusCode).toBe(401);
    });
    test("does not return a battleships game object", () => {
      expect(response.body.game).toEqual(undefined);
    })
    test("does not generate a new token", async () => {
      expect(response.body.token).toEqual(undefined);
    });
  });

  // The following cases are controlled in the Front-end -- buttons will appear conditionally.
  // -------------- FORFEIT WITH TOKEN & GAME ALREADY FINISHED -------------------
  // -------------- FORFEIT WITH TOKEN & GAME NOT JOINED BY PLAYER TWO -------------------
  // -------------- FORFEIT WITH TOKEN & GAME NOT FOUND -------------------
});



// ==================== DELETE ================================
describe("/battleships/:gameID/delete, DELETE", () => {

  // ---------------- ARRANGE: DB cleanup, create 3 Users & token ------------- //
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
    await Battleships.deleteMany({});
  });
  afterAll(async () => {
    await User.deleteMany({});
    await Battleships.deleteMany({});
  });

  // -------------- DELETE WITH TOKEN & NO ERRORS -------------------
  describe("When a token is present and no errors (sessionUser is playerOne && playerTwo does not exist)", () => {
    // ------- ARRANGE: create a game with user1 as playerOne ---------
    beforeEach(async() => {
      game = new Battleships({ playerOne: user1._id })
      await game.save()

      // get id of the created game:
      allGames = await Battleships.find();
      firstGame = allGames[0];

    // ------- ACT: user1 deletes the game ----------------
      response = await request(app)
        .delete(`/battleships/${firstGame._id}/`)
        .set('Authorization', `Bearer ${token}`)
    });

    // ------- ASSERT: response code 200, returns a valid token, and an allGames list that does not include the original game --------------
    test("responds with a 200", async () => {
      expect(response.statusCode).toBe(200);
    })
    test("returns a games list with the game removed", async () => {
      expect(response.body.games).toEqual([]);
    })
    test("generates a valid token", async () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    })
    test("removes game from allGames", async () => {
      const updatedAllGames = await Battleships.find();
      expect(updatedAllGames).toHaveLength(0);
    })
  })


  // -------------- DELETE WITH NO TOKEN ----------------------
  describe("When a token is not present", () => {

    // ------- ARRANGE: create a game with user1 as playerOne ---------
    beforeEach(async() => {
      game = new Battleships({ playerOne: user1._id })
      await game.save()

      // get id of the created game:
      allGames = await Battleships.find();
      firstGame = allGames[0];

    // ------- ACT: user1 deletes the game ----------------
      response = await request(app)
        .delete(`/battleships/${firstGame._id}/`)
    });

    // ------- ASSERT: response code 401, returns no token, no gamesList, and the game has not been removed --------------
    test("responds with a 401", async () => {
      expect(response.statusCode).toBe(401);
    })
    test("no token generated", async () => {
      expect(response.body.token).toEqual(undefined);
    })
    test("no gamesList returned", async () => {
      expect(response.body.games).toEqual(undefined);
    })
    test("does not removes game from allGames", async () => {
      const updatedAllGames = await Battleships.find();
      expect(updatedAllGames).toHaveLength(1);
    })
  })

  // The following cases are controlled in the Front-end -- buttons will appear conditionally.
  // -------------- DELETE WITH TOKEN & GAME ALREADY FULL -------------------
  // -------------- DELETE WITH TOKEN & SESSION USER IS NOT THE HOST (playerOne) -------------------
  // -------------- DELETE WITH TOKEN & GAME NOT FOUND -------------------
})
