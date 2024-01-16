const app = require("../../app");
const request = require("supertest");
require("../mongodb_helper");
const User = require('../../models/user')

const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

let token;
let usersList;

// ======== NON AUTHENTICATION SIGNUP ROUTE ===========================
describe("/signup", () => {
  beforeEach( async () => {
    await User.deleteMany({});
  });

  // ========== CREATE USER =================
  describe("POST, when email and password are provided", () => {
    test("the response code is 201", async () => {
      let response = await request(app)
        .post("/signup")
        .send({email: "poppy@email.com", username: "poppy123", password: "1234"})
      expect(response.statusCode).toBe(201)
    })

    test("a user is created", async () => {
      await request(app)
        .post("/signup")
        .send({email: "scarlett@email.com",  username: "scarlett123", password: "1234"})
      let users = await User.find()
      let newUser = users[users.length - 1]
      expect(newUser.email).toEqual("scarlett@email.com")
    })
  })
  // -------- CREATE USER: ERRORS -------------
  describe("POST, when password is missing", () => {
    test("response code is 400", async () => {
      let response = await request(app)
        .post("/signup")
        .send({email: "skye@email.com"})
      expect(response.statusCode).toBe(400)
    });

    test("does not create a user", async () => {
      await request(app)
        .post("/signup")
        .send({email: "skye@email.com"})
        let users = await User.find()
        expect(users.length).toEqual(0)
    });
  })
  
  describe("POST, when email is missing", () => {
    test("response code is 400", async () => {
      let response = await request(app)
        .post("/signup")
        .send({password: "1234"})
      expect(response.statusCode).toBe(400)
    });

    test("does not create a user", async () => {
      await request(app)
        .post("/signup")
        .send({password: "1234"})
      let users = await User.find()
      expect(users.length).toEqual(0)
    });
  })

});

// ======== AUTHENTICATION ONLY USERS ROUTES ============================
// Mock user ID for testing
const mockUserId = '123456789';

describe("/users", () => {
  beforeAll(async () => {
    usersList = [
      {
        email: "user1@example.com",
        username: "user1",
        password: "password1",
      },
      {
        email: "user2@example.com",
        username: "user2",
        password: "password2",
      },
    ];

    // Save the users to the database
    await User.insertMany(usersList);
  });

  beforeEach(() => {
    token = JWT.sign({
      user_id: mockUserId,
      iat: Math.floor(Date.now() / 1000) - (5 * 60),
      exp: Math.floor(Date.now() / 1000) + (10 * 60)
    }, secret);
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  // ========== FIND ALL USERS: =================
  describe("GET /users when token is valid", () => {
    let response;

    beforeEach(async () => {
      response = await request(app)
        .get("/users")
        .set('Authorization', `Bearer ${token}`)
        .send({ token: token });
    });

    test("returns a status code of 200", () => {
      expect(response.statusCode).toBe(200);
    });
  
    test("returns a list of users", () => {
      expect(response.body.users).toBeDefined();
  
      let users = response.body.users.map((user) => (user.username));
      expect(users).toEqual(["user1", "user2"]);
    });
  
    test("returns a valid token", () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);

    });
  });

  describe("GET /users when there are no users", () => {
    let response;
    beforeEach(async () => {
      await User.deleteMany({});

      response = await request(app)
        .get("/users")
        .set('Authorization', `Bearer ${token}`)
        .send({ token: token });
    });

    test("returns a status code of 200", () => {
      expect(response.statusCode).toBe(200);
    });
  
    test("returns an empty list of users", () => {
      expect(response.body.users).toBeDefined();
      expect(response.body.users).toEqual([]);
      let users = response.body.users.map((user) => (user.username));
      expect(users).toEqual([]);
    });
  
    test("returns a valid token", () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);

    });
  });
  

  describe("GET /users when token is missing", () => {
    let response;

    beforeEach(async () => {
      response = await request(app)
        .get("/users")
    });

    test("returns a status code of 401", async () => {
      expect(response.statusCode).toBe(401);    
    });
    test("returns no users", async () => {
      expect(response.body.users).toEqual(undefined);    
    });
    test("returns no new token", async () => {
      expect(response.body.token).toEqual(undefined);    
    });
  });

  // ========== FIND USER BY ID: =================
  describe("GET /users/:id when token is valid & user is valid", () => {
    let response;
    let allUsers;
    let userId;

    beforeAll(async() => {
      usersList = [
        {
          email: "user1@example.com",
          username: "user1",
          password: "password1",
        },
        {
          email: "user2@example.com",
          username: "user2",
          password: "password2",
        },
      ];
    
      // Save the users to the database -- have to repeat from above, not sure why
      await User.insertMany(usersList);
      // get all users
      allUsers = await User.find();
      const firstUser = allUsers[0];
      userId = firstUser._id;

      response = await request(app)
          .get(`/users/${userId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({token: token});
      });

    test("check that allUsers worked", () => {
        expect(allUsers).toBeDefined();
        expect(allUsers).toHaveLength(2);
    })

    test("returns a status code of 200", () => {
        expect(response.statusCode).toBe(200);
      });

      test("returns the correct user by ID", () => {
      expect(response.body.user).toBeDefined();
      expect(response.body.user._id.toString()).toEqual(userId.toString());
      expect(response.body.user.username.toString()).toEqual("user1");
      expect(response.body.user.password.toString()).toEqual("password1");
      expect(response.body.user.email.toString()).toEqual("user1@example.com");
    });

    test("returns a valid token", () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  });

  describe("GET /users/:id when token is valid and ID does not exist", () => {
    let response;
    let userId = "65a5303a0aaf4a563f531d92";

    beforeEach(async () => {
      response = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ token: token });
    });

    test("returns a status code of 200", () => {
      expect(response.statusCode).toBe(200);
    });

    test("returns an empty object", () => {
      expect(response.body.user).toEqual(null);
    });

    test("returns a valid token", () => {
      expect(response.body.token).toBeDefined();
      let newPayload = JWT.decode(response.body.token, process.env.JWT_SECRET);
      let originalPayload = JWT.decode(token, process.env.JWT_SECRET);
      expect(newPayload.iat > originalPayload.iat).toEqual(true);
    });
  });

  describe("GET /users/:id when token is missing", () => {
    let response;
    let userId;

    beforeEach(async () => {
      // Get all the users
      const allUsers = await User.find()
      const firstUser = allUsers[0];
      userId = firstUser._id;

      response = await request(app)
        .get(`/users/${userId}`)
    });

    test("returns a status code of 401", () => {
      expect(response.statusCode).toBe(401);
    });

    test("returns the correct user by ID", () => {
      expect(response.body.user).toEqual(undefined);
    });

    test("returns no token", () => {
      expect(response.body.token).toEqual(undefined);
    });
  });

})

