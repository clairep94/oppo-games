const TicTacToe = require("../models/tictactoe");
const TokenGenerator = require("../lib/token_generator");
const GamesController = require("./games");

// TODO ADD IN GAME CONTROLLER FOR WIN CONDITIONS
// TODO Add points for this game if there is a win condition

const TicTacToeController = {
  // ================== METHODS SHARED BY ALL GAMES ============================
  // This Index method only shows the properties of allgames, and no game boards
  Index: (req, res) => {
    GamesController.Index(req, res, TicTacToe);
  },
  // Method to fetch a specific TicTacToe game by ID
  FindByID: (req, res) => {
    GamesController.FindByID(req, res, TicTacToe);
  },
  // Method to create a new TicTacToe game
  Create: async (req, res) => {
    GamesController.Create(req, res, TicTacToe);
  },

  // Method to join a TicTacToe game
  Join: async (req, res) => {
    GamesController.Join(req, res, TicTacToe);
  },

  // Method to forfeit a TicTacToe game
  Forfeit: async (req, res) => {
    GamesController.Forfeit(req, res, TicTacToe);
  },

  // Method to delete a TicTacToe game
  Delete: async (req, res) => {
    GamesController.Delete(req, res, TicTacToe);
  },

  // ===================== BATTLESHIP SPECIFIC GAMEPLAY METHODS ============================
  PlacePiece: async (req, res) => {
    const gameID = req.params.id;
    const userID = req.user_id;
    // const userID = req.body.userID; // postman testing purposes only
    const row = req.body.row;
    const col = req.body.col;
    const coordinate = `${row}${col}`;

    try {
      // 1) =========== Find the current game and Catch Errors: =================

      const game = await TicTacToe.findById(gameID); // NOT .populated document
      const whoseTurnID = game.turn % 2 === 0 ? game.playerOne : game.playerTwo;

      const populatedGame = await TicTacToe.findById(gameID) // adding this on because the unpopulated game is used too many times below.
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Users cannot play on finished games.
      if (game.finished === true) {
        console.log("ERROR: GAME FINISHED");
        const token = TokenGenerator.jsonwebtoken(req.user_id);
        return res.status(403).json({
          error: "Game already finished.",
          game: populatedGame,
          token: token,
        }); //return the old game so as to not mess up the rendering
      }
      // Users cannot play outside of their turn.
      if (userID != whoseTurnID) {
        // NOTE by Claire: this is != and not !== on purpose. game.whose_turn and userID are not the same datatype but can be compared this way.
        console.log("ERROR: IT IS NOT YOUR TURN");
        const token = TokenGenerator.jsonwebtoken(req.user_id);
        return res.status(403).json({
          error: "It is not your turn.",
          game: populatedGame,
          token: token,
        }); //return the old game so as to not mess up the rendering
      } // Users cannot play on occupied spaces.
      if (
        game.xPlacements.includes(coordinate) ||
        game.oPlacements.includes(coordinate)
      ) {
        console.log("ERROR: THERE IS ALREADY A PIECE HERE");
        const token = TokenGenerator.jsonwebtoken(req.user_id);
        return res.status(403).json({
          error: "Cannot place piece on occupied tile.",
          game: populatedGame,
          token: token,
        }); //return the old game so as to not mess up the rendering
      }

      // 2) ============ Place the piece & get the updated game data ==================
      const piece = userID == game.playerOne ? "X" : "O"; // NOTE by Claire: this is == and not === on purpose, see line 80. do not change.
      const placementField = piece === "X" ? "xPlacements" : "oPlacements";

      const placedPieceGame = await TicTacToe.findOneAndUpdate(
        // NOT .populated yet.
        { _id: gameID },
        {
          $set: { [`gameBoard.${row}.${col}`]: piece },
          $push: { [placementField]: coordinate },
          $inc: { turn: 1 }, // Increment the turn property by 1
        },
        { new: true }
      );

      // 3) ============= Check for wins: ===========================
      // ------- supportive functions for win-checking -------------
      // Check if any of the game.winning_placements arrays in any order are in game.xPlacements and game.oPlacements:
      const checkWin = (array) => {
        console.log(`checking wins for ${array}`);

        const winningCombinations = [
          ["A1", "A2", "A3"],
          ["B1", "B2", "B3"],
          ["C1", "C2", "C3"],
          ["A1", "B1", "C1"],
          ["A2", "B2", "C2"],
          ["A3", "B3", "C3"],
          ["A1", "B2", "C3"],
          ["A3", "B2", "C1"],
        ];

        const isSubset = (subset, superset) =>
          subset.every((element) => superset.includes(element));
        return winningCombinations.some((winningCombo) =>
          isSubset(winningCombo, array)
        );
      };

      // use checkWin on the last played the relevant placementField
      const win = checkWin(
        piece === "X"
          ? placedPieceGame.xPlacements
          : placedPieceGame.oPlacements
      ); // could not do placedPieceGame.placementField directly as it is a string.

      // ------- IF WIN: -----------------------
      if (win) {
        // if a player won, update the game and return the ID
        try {
          const wonGame = await TicTacToe.findOneAndUpdate(
            { _id: gameID },
            {
              $push: { winner: userID },
              $set: { finished: true },
            },
            { new: true }
          )
            .populate("playerOne", "_id username points")
            .populate("playerTwo", "_id username points")
            .populate("winner", "_id username points");

          const token = TokenGenerator.jsonwebtoken(req.user_id);
          res.status(200).json({ token: token, game: wonGame });
          // res.status(200).json({game: wonGame});
        } catch (error) {
          console.error("Error handling win: ", error);
          res.status(500).json(error);
        }

        // ------- IF NO WON: -----------------------
      } else {
        // if no wins, increase the turn and check for a draw

        // ------- IF DRAW: -----------------------
        if (placedPieceGame.turn === 9) {
          // draw condition: update the game and return the draw game data
          try {
            const drawGame = await TicTacToe.findOneAndUpdate(
              { _id: gameID },
              {
                $set: {
                  winner: [
                    placedPieceGame.playerOne,
                    placedPieceGame.playerTwo,
                  ],
                  finished: true,
                },
              },
              { new: true }
            )
              .populate("playerOne", "_id username points")
              .populate("playerTwo", "_id username points")
              .populate("winner", "_id username points");

            const token = TokenGenerator.jsonwebtoken(req.user_id);
            res.status(200).json({ token: token, game: drawGame });
            // res.status(200).json({game: drawGame});
          } catch (error) {
            console.error("Error handling draw: ", error);
            res.status(500).json(error);
          }

          // ------- ELSE: -----------------------
        } else {
          // populate the placedPieceGame data and return the game data
          const populatedNextTurnGame = await TicTacToe.populate(
            placedPieceGame,
            { path: "playerOne", select: "_id username points" }
          );
          await TicTacToe.populate(populatedNextTurnGame, {
            path: "playerTwo",
            select: "_id username points",
          });
          await TicTacToe.populate(populatedNextTurnGame, {
            path: "winner",
            select: "_id username points",
          });

          const token = TokenGenerator.jsonwebtoken(req.user_id);
          res.status(200).json({ token: token, game: populatedNextTurnGame });
          // res.status(200).json({game: populatedNextTurnGame});
        }
      }
    } catch (error) {
      console.error("Error placing piece: ", error);
      res.status(500).json(error);
    }
  },
};

module.exports = TicTacToeController;
