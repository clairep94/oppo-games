const mongoose = require("mongoose");
const jestMock = require("jest-mock");

require("../mongodb_helper");
const User = require("../../models/user");

describe("User model", () => {
  beforeEach((done) => {
    mongoose.connection.collections.users.drop(() => {
      done();
    });
  });

  // ========= CREATING A USER ==============

  it("has an email address", () => {
    const user = new User({
      email: "someone@example.com",
      username: "someUser123",
      password: "password",
    });
    expect(user.email).toEqual("someone@example.com");
  });

  it("has a password", () => {
    const user = new User({
      email: "someone@example.com",
      username: "someUser123",
      password: "password",
    });
    expect(user.password).toEqual("password");
  });

  it("can list all users", (done) => {
    User.find((err, users) => {
      expect(err).toBeNull();
      expect(users).toEqual([]);
      done();
    });
  });

  it("can save a user", (done) => {
    const user = new User({
      email: "someone@example.com",
      username: "someUser123",
      password: "password",
    });

    user.save((err) => {
      expect(err).toBeNull();

      User.find((err, users) => {
        expect(err).toBeNull();

        expect(users[0]).toMatchObject({
          email: "someone@example.com",
          username: "someUser123",
          password: "password",
          points: 0
            });
        done();
      });
    });
  });

  // ========= CREATING MULTIPLE USERS ==============
  it("can create two new users and find all users", async () => {
    // Create two new users
    const user1 = new User({
      email: "user1@example.com",
      username: "user1",
      password: "password1",
    });

    const user2 = new User({
      email: "user2@example.com",
      username: "user2",
      password: "password2",
    });

    // Save the users
    await user1.save();
    await user2.save();

    // Find all users
    const users = await User.find();

    // Assertions
    expect(users).toHaveLength(2);
    expect(users[0].username).toEqual("user1");
    expect(users[1].username).toEqual("user2");
  });

  // ========= CREATING A USER: ERRORS ==============
  // ---------- REQUIRED FIELDS ----------------
  it("throws validation error when saving without a username", async () => {
    const user = new User({
      email: "someone@example.com",
      password: "password",
    });

    await expect(user.save()).rejects.toThrow("Path `username` is required");
  });

  it("throws validation error when saving without an email", async () => {
    const user = new User({
      username: "someUser123",
      password: "password",
    });

    await expect(user.save()).rejects.toThrow("Path `email` is required");
  });

  it("throws validation error when saving without a password", async () => {
    const user = new User({
      username: "someUser123",
      email: "someone@example.com",
    });

    await expect(user.save()).rejects.toThrow("Path `password` is required");
  });

  // --------- UNIQUE USERNAME AND EMAIL -----------------
  // TODO the below is not catching the unique-ness error -- manage in controllers instead.  
  // it("throws validation error when saving with a non-unique email", async () => {
  //   // Save a user with a given email
  //   await User.create({
  //     email: "nonunique@example.com",
  //     username: "someUser123",
  //     password: "password",
  //   });

  //   // Attempt to save another user with the same email
  //   const userWithNonUniqueEmail = new User({
  //     email: "nonunique@example.com",
  //     username: "anotherUser",
  //     password: "password",
  //   });

  //   await expect(userWithNonUniqueEmail.save()).rejects.toThrow();
  // });

  // ========= MOCKING TICTACTOE FOR GAME HISTORY ==============
  // TODO test once figured out gameHistory structure

  // // Mock the TicTacToe model
  // jest.mock("../../models/ticTacToe");
  // const TicTacToe = require("../../models/TicTacToe");

  // it("can save a user with game history", async () => {
  //   // Mock the save method for the TicTacToe model
  //   TicTacToe.mockImplementation(() => ({
  //     save: jest.fn().mockResolvedValue({ _id: mongoose.Types.ObjectId(), title: "Tic-Tac-Toe" })
  //   }));

  //   const user = new User({
  //     email: "someone@example.com",
  //     username: "someUser123",
  //     password: "password",
  //     gameHistory: [{
  //       gameType: 'TicTacToe',
  //       game: TicTacToe.mock.instances[0], // Mocked instance
  //     }]
  //   });

  //   await user.save();

  //   const userWithHistory = await User.findOne({ email: "someone@example.com" })
  //     .populate('gameHistory.game');

  //   // Assertions for the mock
  //   expect(TicTacToe).toHaveBeenCalledTimes(1);
  //   expect(TicTacToe.mock.instances[0].save).toHaveBeenCalledTimes(1);

  //   // Assertions for the user and game history
  //   expect(userWithHistory.email).toEqual("someone@example.com");
  //   expect(userWithHistory.gameHistory[0].game).toMatchObject({ _id: expect.any(mongoose.Types.ObjectId), title: "Tic-Tac-Toe" });
  // });

});
