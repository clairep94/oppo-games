const mongoose = require("mongoose");
const jestMock = require("jest-mock");

require("../mongodb_helper");
const TicTacToe = require("../../models/tictactoe");

describe("TicTacToe model", () => {
  beforeEach((done) => {
    mongoose.connection.collections.tictactoes.drop(() => {
      done();
    });
  });

  // ========= CREATING A TICTACTOE GAME ==============
  // Mock a playerOne object
  const playerOneId = mongoose.Types.ObjectId(); // Generate a new ObjectId

  const playerOneMock = {
    _id: playerOneId,
    username: "mockedPlayerOne",
  };

  const loadedBoard = {
    A: { 1: "X", 2: " ", 3: " " },
    B: { 1: " ", 2: "O", 3: " " },
    C: { 1: "X", 2: " ", 3: " " },
  }

  const emptyBoard = {
    A: { 1: " ", 2: " ", 3: " " },
    B: { 1: " ", 2: " ", 3: " " },
    C: { 1: " ", 2: " ", 3: " " },
  }

  it("has title, endpoint, playerOne, winner, finished, turn", () => {
    // check default values for all games
    const tictactoe = new TicTacToe({
      playerOne: playerOneMock._id
    });
    expect(tictactoe.playerOne).toEqual(playerOneMock._id);
    expect(tictactoe.title).toEqual("Tic-Tac-Toe");
    expect(tictactoe.endpoint).toEqual("tictactoe");
    expect(tictactoe.winner).toHaveLength(0); // empty array vs coreMongooseArray
    expect(tictactoe.finished).toEqual(false);
    expect(tictactoe.turn).toEqual(0);
  });

  it("has empty xPlacements, oPlacements, gameBoard", () => {
    // check default values for TTT specifically
    const tictactoe = new TicTacToe({
      playerOne: playerOneMock._id
    });

    expect(tictactoe.xPlacements).toHaveLength(0); // empty array vs coreMongooseArray
    expect(tictactoe.oPlacements).toHaveLength(0); // empty array vs coreMongooseArray
    expect(tictactoe.gameBoard).toEqual(emptyBoard);
  });

  it("can have a specific gameBoard", () => {
    // check default values for TTT specifically
    const tictactoe = new TicTacToe({
      playerOne: playerOneMock._id,
      gameBoard: loadedBoard
    });

    expect(tictactoe.gameBoard).toEqual(loadedBoard);
  });


  it("can list all tictactoe games", (done) => {
    TicTacToe.find((err, tictactoes) => {
      expect(err).toBeNull();
      expect(tictactoes).toEqual([]);
      done();
    });
  });

  it("can save a tictactoe", (done) => {
    const tictactoe = new TicTacToe({
      playerOne: playerOneMock._id,
    });

    tictactoe.save((err) => {
      expect(err).toBeNull();

      TicTacToe.find((err, tictactoes) => {
        expect(err).toBeNull();

        expect(tictactoes[0]).toMatchObject({ // skipping arrays, as I cannot test
          title: 'Tic-Tac-Toe',
          endpoint: 'tictactoe',
          playerOne: playerOneMock._id,
          turn: 0,
          finished: false,
          gameBoard: emptyBoard
        });
        done();
      });
    });
  });

  // // ========= CREATING MULTIPLE GAMES ==============
  it("can create two new tictactoes and find all tictactoes", async () => {
    // Create two new tictactoes
    const tictactoe1 = new TicTacToe({
      playerOne: playerOneMock._id
    });

    const tictactoe2 = new TicTacToe({
      playerOne: playerOneMock._id
    });

    // Save the tictactoes
    await tictactoe1.save();
    await tictactoe2.save();

    // Find all tictactoes
    const tictactoes = await TicTacToe.find();

    // Assertions
    expect(tictactoes).toHaveLength(2);
    expect(tictactoes[0].playerOne).toEqual(playerOneMock._id);
    expect(tictactoes[1].playerOne).toEqual(playerOneMock._id);
  });

  // ========= CREATING A GAME: ERRORS ==============
  // ---------- REQUIRED FIELDS ----------------
  it("throws validation error when saving without a playerOne", async () => {
    const tictactoe = new TicTacToe({
    });

    await expect(tictactoe.save()).rejects.toThrow("TicTacToe validation failed: playerOne: Games must have a host");
  });

});
