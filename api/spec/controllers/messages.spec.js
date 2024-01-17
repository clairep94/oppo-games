const app = require("../../app");
const request = require("supertest");
require("../mongodb_helper");
const Message = require('../../models/message');
const User = require('../../models/user');
const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

let token;
let messagesList;

describe("/messages", () => {
  let user

  // ========== ARRANGE: DB cleanup, create User & token =============== //
  beforeAll( async () => {
    user = new User({email: "test@test.com", username: "user123", password: "12345678"});
    await user.save();

    token = JWT.sign({
      user_id: user.id,
      // Backdate this token of 5 minutes
      iat: Math.floor(Date.now() / 1000) - (5 * 60),
      // Set the JWT token to expire in 10 minutes
      exp: Math.floor(Date.now() / 1000) + (10 * 60)
    }, secret);
  });

  beforeEach( async () => {
    await Message.deleteMany({});
  })

  afterAll( async () => {
    await User.deleteMany({});
    await Message.deleteMany({});
  })

  // ========== CREATE A MESSAGE: token & no errors =============== //
  describe("POST /messages, when token is present", () => {
    let response;

    // -------- ACT: create message ----------
    beforeEach( async() => {
      response = await request(app)
        .post("/messages")
        .set("Authorization", `Bearer ${token}`)
        .send({ gameID: "123", author: user._id, body: "Some message" });
    })

    // ------- ASSERT: Response code 201, Returns valid token & new message --------------
    test("returns a status code of 201", () => {
      expect(response.statusCode).toBe(201);
    })
    test("returns a message object with populated author", () => {
    const expectedResponse = {
        gameID: "123",
        author: {
          _id: expect.any(String),
          username: "user123",
        },
        body: "Some message",
    };
    expect(response.body.newMessage).toMatchObject(expectedResponse);
  });
    test("returns a valid token", () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  })

  // ========== CREATE A MESSAGE: no token =============== //
  describe("POST /messages, when token is not present", () => {
    let response;

    // -------- ACT: create message without a token ----------
    beforeEach( async() => {
      response = await request(app)
        .post("/messages")
        .send({ gameID: "123", author: user._id, body: "Some message" });
    })
    // ------- ASSERT: Returns Response code 401, does not create new message, does not return new token --------------
    test("returns a status code of 401", () => {
      expect(response.statusCode).toBe(401);
    })
    test("does not create a message", async () => {
      let messages = await Message.find()
      expect(messages.length).toEqual(0);
      // expect(response.body).toEqual({"message": "auth error"});
    })
    test("returns no new token", async () => {
      expect(response.body.token).toEqual(undefined);    
    });
  })


  // ========== FIND A MESSAGE THREAD: token & no errors & not empty result =============== //
  describe("GET /messages/:gameID, when token is present", () => {
    let messageResponse1;
    let messageResponse2;
    let response;
    let user2;
    const gameID = "123";

    // ------ ARRANGE: create 2 messages in the same game chat ------------//
    beforeEach( async() => {
      
      // save 2 messages in the same game chat
      messageResponse1 = await request(app)
        .post("/messages")
        .set("Authorization", `Bearer ${token}`)
        .send({ gameID: gameID, author: user._id, body: "Some message" });

      messageResponse2 = await request(app)
      .post("/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ gameID: gameID, author: user._id, body: "Replying to myself" });

      // ------ ACT: fetch all messages under this game ID ------------//
      response = await request(app)
        .get(`/messages/${gameID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({token: token});
      })

    // -------- ASSERT: Response Code 200, Returns messages array & valid token ----------------- //
    test("returns a status code of 200", () => {
      expect(response.statusCode).toBe(200);
    })
    test("returns an array with message objects with populated authors", () => {
      const expectedMessage1 = {
          gameID: "123",
          author: {
            _id: expect.any(String),
            username: "user123",
          },
          body: "Some message",
      };
      const expectedMessage2 = {
          gameID: "123",
          author: {
            _id: expect.any(String),
            username: "user123",
          },
          body: "Replying to myself",
      };
      expect(response.body.allMessages).toHaveLength(2);
      expect(response.body.allMessages[0]).toMatchObject(expectedMessage1);
      expect(response.body.allMessages[1]).toMatchObject(expectedMessage2);
    });
    test("returns a valid token", () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  })


  // ========== FIND AN EMPTY MESSAGE THREAD: token & no errors & empty array result =============== //
  describe("GET /messages/:gameID, when token is present but thread is empty", () => {
    let response;
    const gameID = "123";

    // ------ ARRANGE: No chats added under this game ID --------
    // do nothing

    // ------ ACT: Search for chats under this game ID --------
    beforeEach( async() => {
      // fetch all messages under this game ID
      response = await request(app)
        .get(`/messages/${gameID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({token: token});
      })

    // -------- ASSERT: Response code 200, return empty array and a valid token -----------------
    test("returns a status code of 200", () => {
      expect(response.statusCode).toBe(200);
    })
    test("returns an empty array with message objects with populated authors", () => {
      expect(response.body.allMessages).toHaveLength(0);
    });
    test("returns a valid token", () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  })


  // ========== FIND A MESSAGE THREAD: no token =============== //
  describe("GET /messages/:gameID, when token is not present", () => {
    let response;

    // ------ ARRANGE:  --------
    // do nothing

    // ------ ACT: Search for chats under this game ID with no token --------
    beforeEach( async() => {
      response = await request(app)
        .get('/messages')
    })

    // -------- ASSERT: Response code 401, return no object in body and no token -----------------
    test("returns a status code of 401", () => {
      expect(response.statusCode).toBe(401);
    });
    test("does not return an array of messages", () => {
      expect(response.body.allMessages).toEqual(undefined);
    })
    test("returns no new token", async () => {
      expect(response.body.token).toEqual(undefined);    
    });
  })
})



