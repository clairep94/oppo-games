const Battleships = require("../models/battleships");
const TokenGenerator = require("../lib/token_generator");
const GamesController = require("./games");
// TODO ADD IN GAME CONTROLLER FOR WIN CONDITIONS
// TODO Add points for this game if there is a win condition

// ============ HELPER FUNCTIONS FOR CONCEALMENT: ===================
const concealedBattleshipsView = (populatedGame, viewerID) => {
  // All concealment occurs in the backend before the final game data is returned, rather than in the frontend display methods, so that players cannot cheat by inspecting the data.
  // If the viewer is not the owner of a board or shipyard, they will get a concealed version of each.
  // If the game is over (finished === true): no concealment occurs and the function returns the original populatedGame.

  const shipCodes = ["C", "B", "R", "U", "D"];

  // The structure below allows for concealment for both opponents and observers.
  const concealBoard = (board) => {
    // Iterate over all spaces and change all spaces with "s" to ""
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (shipCodes.includes(board[i][j])) {
          board[i][j] = "";
        }
      }
    }
    return board;
  };

  if (populatedGame && !populatedGame.finished) {
    // If viewer is not playerOne: (viewer is playerTwo or observer)
    if (viewerID != populatedGame.playerOne._id) {
      // Needs to be != and not !== due to mongoose having its own data types
      const concealedBoard = concealBoard(populatedGame.playerOneBoard);
      populatedGame.playerOneBoard = concealedBoard;

      for (const ship in populatedGame.playerOneShips) {
        delete populatedGame.playerOneShips[ship].units;
      }
      if (populatedGame.playerOnePlacements.length !== 0) {
        populatedGame.playerOnePlacements = "submitted";
      }
    }
    // If viewer is not playerTwo: (viewer is playerOne or observer)
    if (viewerID != populatedGame.playerTwo?._id) {
      // this syntax for when there is no player two yet.
      // Needs to be != and not !== due to mongoose having its own data types
      const concealedBoard = concealBoard(populatedGame.playerTwoBoard);
      populatedGame.playerTwoBoard = concealedBoard;

      for (const ship in populatedGame.playerTwoShips) {
        delete populatedGame.playerTwoShips[ship].units;
      }
      if (populatedGame.playerTwoPlacements.length !== 0) {
        populatedGame.playerTwoPlacements = "submitted";
      }
    }
  }
  return populatedGame;
};

// ============ CONTROLLER ===============================

const BattleshipsController = {
  // ================== METHODS SHARED BY ALL GAMES ============================
  // Method to fetch all Battleships games
  Index: (req, res) => {
    GamesController.Index(req, res, Battleships, concealedBattleshipsView);
  },

  // Method to fetch a specific Battleships game by ID
  FindByID: (req, res) => {
    GamesController.FindByID(req, res, Battleships, concealedBattleshipsView);
  },

  // Method to create a new Battleships game
  Create: async (req, res) => {
    GamesController.Create(req, res, Battleships);
  },

  // Method to join a Battleships game
  Join: async (req, res) => {
    GamesController.Join(req, res, Battleships, concealedBattleshipsView);
  },

  // Method to forfeit a Battleships game
  Forfeit: async (req, res) => {
    GamesController.Forfeit(req, res, Battleships, concealedBattleshipsView);
  },

  // Method to delete a Battleships game
  Delete: async (req, res) => {
    GamesController.Delete(req, res, Battleships, concealedBattleshipsView);
  },

  // ===================== BATTLESHIP SPECIFIC GAMEPLAY METHODS ============================
  SubmitShipPlacements: async (req, res) => {
    const gameID = req.params.id;
    const userID = req.user_id;
    const placements = req.body.placements; // See models/battleships lines 103-115 for useage / format
    const token = TokenGenerator.jsonwebtoken(req.user_id);

    try {
      // 1) =========== Find the current game and Catch Errors: =================
      const game = await Battleships.findById(gameID);

      // Game not found
      if (!game) {
        return res.status(404).json({ error: "Game not found", token: token });
      }

      // Users cannot submit placements if they are not in the game.
      if (userID != game.playerOne && userID != game.playerTwo) {
        // needs to be != due to Mongoose datatypes
        console.log("ERROR: YOU'RE NOT IN THIS GAME");
        return res
          .status(403)
          .json({ error: "Observers cannot place ships", token: token });
      }

      // Users cannot submit placements without a playerTwo
      if (!game.playerTwo) {
        console.log("ERROR: AWAITING PLAYER TWO");
        return res.status(403).json({
          error: "Cannot place ships till player two joins.",
          token: token,
        });
      }

      // Users cannot submit on completed games.
      if (game.finished === true) {
        console.log("ERROR: GAME FINISHED");
        return res
          .status(403)
          .json({ error: "Game already finished.", token: token });
      }

      // Users cannot submit incomplete ship placements
      const checkPlacementCompletion = (placements) => {
        const counts = {
          C: 5, // carrier
          B: 4, // battleship
          R: 3, // cruiser
          U: 3, // submarine
          D: 2, // destroyer
        };

        for (let i = 0; i < placements.length; i++) {
          for (let j = 0; j < placements[i].length; j++) {
            if (placements[i][j] in counts) {
              counts[placements[i][j]]--; // Decrement the count for the corresponding ship type
            }
          }
        }

        // Check if all counts are 0
        return Object.values(counts).every((count) => count === 0);
      };
      if (!checkPlacementCompletion(placements)) {
        console.log("ERROR: INCOMPLETE PLACEMENTS");
        return res.status(403).json({
          error: "Please place all ships",
          token: token,
        });
      }

      // 2) =========== Update the user's board with the ship placements: =================
      // const shipCodeMap = {
      //   C: "carrier",
      //   B: "battleship",
      //   R: "cruiser",
      //   U: "submarine",
      //   D: "destroyer",
      // };

      // Find corresponding Board for the sessionUser -- case for sessionUser not being in this game is handled in line 285.
      // needs to be ==  not === due to Mongoose datatypes
      // const targettedBoardVar = targetStr + "Board";
      const userPlayerStr =
        userID == game.playerOne ? "playerOne" : "playerTwo";

      const userBoardVar = userPlayerStr + "Board";
      const userBoard = game[userBoardVar];
      const userPlacementsVar = userPlayerStr + "Placements";

      // Users cannot submit ships if placements already exist
      let emptyBoard = [
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
      ];
      if (JSON.stringify(userBoard) !== JSON.stringify(emptyBoard)) {
        // had to JSON.stringify the two nested arrays to compare content
        console.log("ERROR: SHIPS ALREADY PLACED");
        return res.status(403).json({
          error: "Ships have already been placed and game has already started.",
          token: token,
        });
      }

      const placedShipsGame = await Battleships.findOneAndUpdate(
        { _id: gameID },
        {
          $set: { [userBoardVar]: placements, [userPlacementsVar]: placements },
        },
        { new: true }
      )
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // ======== 3) Conceal the boards according to who is looking (playerOne, playerTwo, outsider) ============
      const concealedPlacedShipsGame = concealedBattleshipsView(
        placedShipsGame,
        userID
      );
      // console.log("Submitted Placements Game: ", concealedPlacedShipsGame);

      res.setHeader("Cache-Control", "no-store, no-cache");
      res.status(200).json({ token: token, game: concealedPlacedShipsGame });
    } catch (error) {
      console.error("Error submitting ship placements: ", error);
      res.status(500).json(error);
    }
  },

  // ======= LAUNCH MISSILE ============
  LaunchMissile: async (req, res) => {
    const gameID = req.params.id;
    const userID = req.user_id;
    const row = req.body.row; //index
    const col = req.body.col; //index
    const token = TokenGenerator.jsonwebtoken(req.user_id);
    const shipCodes = ["C", "B", "R", "U", "D"];
    let message;

    try {
      // 1) =========== Find the current game and Catch Errors: =================
      const currentGame = await Battleships.findById(gameID);
      console.log(currentGame);

      // Game not found
      if (!currentGame) {
        return res.status(404).json({ error: "Game not found", token: token });
      }

      // Users cannot submit placements if they are not in the game.
      if (userID != currentGame.playerOne && userID != currentGame.playerTwo) {
        // needs to be != due to Mongoose datatypes
        console.log("ERROR: YOU'RE NOT IN THIS GAME");
        return res
          .status(403)
          .json({ error: "Observers cannot launch missiles", token: token });
      }

      // Users cannot launch on completed games.
      if (currentGame.finished === true) {
        console.log("ERROR: GAME FINISHED");
        return res
          .status(403)
          .json({ error: "Game already finished.", token: token });
      }

      // Cannot launch if it is not your turn
      const whoseTurnID =
        currentGame.turn % 2 === 0
          ? currentGame.playerOne
          : currentGame.playerTwo;
      if (userID != whoseTurnID) {
        // has to be != not !== due to mongoose data type
        console.log("ERROR: IT IS NOT YOUR TURN");
        return res
          .status(403)
          .json({ error: "It is not your turn.", token: token });
      }

      // Cannot launch out of bounds
      if (row > 9 || col > 9) {
        console.log("ERROR: MISSILE LAUNCHED OUT OF BOUNDS");
        return res
          .status(403)
          .json({ error: "Launch target is out of bounds.", token: token });
      }

      // 2) ============= Launch the missile & get the updated game data ==================
      const targetStr =
        userID == currentGame.playerOne ? "playerTwo" : "playerOne"; // needs to be == due to Mongoose datatypes
      const targettedBoardVar = targetStr + "Board";
      const targettedBoard = currentGame[targettedBoardVar];
      const targettedShipyardVar = targetStr + "Ships";
      const targettedShipyard = currentGame[targettedShipyardVar];
      // needs to be ==  not === due to Mongoose datatypes
      const targetID =
        userID == currentGame.playerOne
          ? currentGame.playerTwo
          : currentGame.playerOne;

      const shipCodeMap = {
        C: "carrier",
        B: "battleship",
        R: "cruiser",
        U: "submarine",
        D: "destroyer",
      };

      let message;
      let finished = currentGame.finished;
      let winner = currentGame.winner;

      // Users cannot launch if their opponent has not set up their board yet
      emptyBoard = [
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
      ];
      if (JSON.stringify(targettedBoard) === JSON.stringify(emptyBoard)) {
        console.log("ERROR: OPPONENT NOT READY.");
        return res.status(403).json({
          error: "Opponent has not set up their board yet.",
          token: token,
        });
      }

      // Users cannot launch in an explored space
      if (
        targettedBoard[row][col] === "X" ||
        targettedBoard[row][col] === "/"
      ) {
        console.log("ERROR: SPACE ALREADY HIT");
        return res
          .status(403)
          .json({ error: "Already hit this space.", token: token });
      }

      // -------- IF HIT: ----------------------
      if (targettedBoard[row][col] in shipCodeMap) {
        const shipCode = targettedBoard[row][col];
        const hitShip = shipCodeMap[shipCode]; // carrier, battleship, cruiser, submarine, destroyer

        // A) Update the shipyard, decremate the units
        targettedShipyard[hitShip].units--;
        // B) Update the board
        targettedBoard[row][col] = "X";
        // C) Check sank & win:
        if (targettedShipyard[hitShip].units === 0) {
          targettedShipyard[hitShip].sank_status = true;
          // console.log(targettedShipyard[hitShip]);

          const checkWin = (shipyard) => {
            for (const ship in shipyard) {
              if (!shipyard[ship].sank_status) {
                return false; // If any ship's sank_status is false, return false
              }
            }
            return true; // If all ships' sank_status are true, return true
          };

          // ---- WIN CONDITION -------
          if (checkWin(targettedShipyard)) {
            message = "WIN";
            finished = true;
            winner = [userID];

            // ----- SANK CONDITION ------
          } else {
            message = `SANK: ${hitShip.toUpperCase()}`;
          }

          // ---- HIT CONDITION --------
        } else {
          message = "HIT";
        }

        // -------- MISS CONDITION -----------------
      } else {
        targettedBoard[row][col] = "/";
        message = "MISSED";
      }

      // 3) ============ PUT REQUEST WITH CORRESPONDING GAME UPDATE ====================
      const updatedGame = await Battleships.findOneAndUpdate(
        { _id: gameID },
        {
          $set: {
            [targettedBoardVar]: targettedBoard,
            [targettedShipyardVar]: targettedShipyard,
            finished: finished,
            winner: winner,
          },
          $inc: { turn: 1 },
        },
        { new: true }
      )
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      const concealedGame = concealedBattleshipsView(updatedGame, userID);
      res.setHeader("Cache-Control", "no-store, no-cache");
      res.status(200).json({
        game: concealedGame,
        token: token,
        target: targetID,
        actor: userID,
        message: message,
      });
    } catch (error) {
      console.error("Error placing piece: ", error);
      res.status(500).json(error);
    }
  },
};

module.exports = BattleshipsController;
