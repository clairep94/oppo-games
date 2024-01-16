const mongoose = require("mongoose");
const jestMock = require("jest-mock");

require("../mongodb_helper");
const Message = require("../../models/message");

describe("Message model", () => {
  beforeEach((done) => {
    mongoose.connection.collections.messages.drop(() => {
      done();
    });
  });

  // ========= CREATING A TICTACTOE GAME ==============
  // Mock a author object
  const authorMockId = mongoose.Types.ObjectId(); // Generate a new ObjectId

  const authorMock = {
    _id: authorMockId,
    username: "mockedPlayerOne",
  };

  it("has a gameID, author, body", () => {
    // check default values for all games
    const message = new Message({
      gameID: '1',
      author: authorMock._id,
      body: 'some message'
    });
    expect(message.author).toEqual(authorMock._id);
    expect(message.gameID).toEqual("1");
    expect(message.body).toEqual("some message");
  });

  it("can list all messages", (done) => {
    Message.find((err, messages) => {
      expect(err).toBeNull();
      expect(messages).toEqual([]);
      done();
    });
  });

  it("can save a message", (done) => {
    const message = new Message({
      gameID: '1',
      author: authorMock._id,
      body: 'some message'
    });

    message.save((err) => {
      expect(err).toBeNull();

      Message.find((err, messages) => {
        expect(err).toBeNull();

        expect(messages[0]).toMatchObject({
          gameID: '1',
          author: authorMock._id,
          body: 'some message'
        });
        done();
      });
    });
  });

  // ========= CREATING MULTIPLE GAMES ==============
  it("can create two new messages and find all messages", async () => {
    // Create two new messages
    const message1 = new Message({
      gameID: '1',
      author: authorMock._id,
      body: 'some message'
    });

    const message2 = new Message({
      gameID: '1',
      author: authorMock._id,
      body: 'some other message'
    });

    // Save the messages
    await message1.save();
    await message2.save();

    // Find all messages
    const messages = await Message.find();

    // Assertions
    expect(messages).toHaveLength(2);
    expect(messages[0].author).toEqual(authorMock._id);
    expect(messages[0].gameID).toEqual("1");
    expect(messages[0].body).toEqual("some message");

    expect(messages[1].author).toEqual(authorMock._id);
    expect(messages[1].gameID).toEqual("1");
    expect(messages[1].body).toEqual("some other message");
  });

  // ========= CREATING A GAME: ERRORS ==============
  // ---------- REQUIRED FIELDS ----------------
  it("throws validation error when saving without a author", async () => {
    const message = new Message({
      gameID: '1',
      body: 'something message'
    });

    await expect(message.save()).rejects.toThrow("Message validation failed: author: Messages must have an author");
  });

});
