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

  // ========== SETTING UP TESTS =============== //
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

  // ========== CREATE A MESSAGE: valid, errors =============== //
  describe("POST /messages, when token is present", () => {
    let response;

    // create message
    beforeEach( async() => {
      response = await request(app)
        .post("/messages")
        .set("Authorization", `Bearer ${token}`)
        .send({ gameID: "123", author: user._id, body: "Some message" });
    })

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

  // TODO change this to protected once all methods are tested without protection
  // test("returns a valid token", () => {
  //   expect(response.body.token).toBeDefined();
  //   let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
  //   let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
  //   expect(newPayload.iat > originalPayload.iat).toEqual(true);
  // });
  })

  // ========== FIND A MESSAGE THREAD: valid, empty, errors =============== //
  describe("GET /messages/:gameID, when token is present", () => {
    let messageResponse1;
    let messageResponse2;
    let response;
    // let allMessages;
    // let userID;
    let user2;
    const gameID = "123";

    // Setup: create 2 messages in the same game chat
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

      // fetch all messages under this game ID
      response = await request(app)
        .get(`/messages/${gameID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({token: token});
      })

      // -------- Tests: RESPONSE CODE -----------------
      test("returns a status code of 200", () => {
        expect(response.statusCode).toBe(200);
      })
      // -------- Tests: BODY -----------------
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

      // -------- Tests: TOKEN -----------------
      // TODO change this to protected once all methods are tested without protection
      // test("returns a valid token", () => {
      //   expect(response.body.token).toBeDefined();
      //   let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      //   let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      //   expect(newPayload.iat > originalPayload.iat).toEqual(true);
      // });
  })
})


