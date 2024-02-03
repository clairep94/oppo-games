const Battleships = require("../models/battleships");
const TokenGenerator = require("../lib/token_generator");
const { TokenExpiredError } = require("jsonwebtoken");
// TODO ADD IN GAME CONTROLLER FOR WIN CONDITIONS
// TODO Add points for this game if there is a win condition

// ============ HELPER FUNCTIONS FOR CONCEALMENT: ===================
// All concealment occurs in the backend before the final game data is returned, rather than in the frontend display methods, so that players cannot cheat by inspecting the data.
// If the viewer is not the owner of a board or shipyard, they will get a concealed version of each.
const concealedGameView = (populatedGame, viewerID) => {
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
  // If viewer is not playerOne: (viewer is playerTwo or observer)
  if (populatedGame && viewerID != populatedGame.playerOne._id) {
    // Needs to be != and not !== due to mongoose having its own data types
    const concealedBoard = concealBoard(populatedGame.playerOneBoard);
    populatedGame.playerOneBoard = concealedBoard;

    populatedGame.playerOneShips = {
      carrier: { sank_status: false },
      battleship: { sank_status: false },
      cruiser: { sank_status: false },
      submarine: { sank_status: false },
      destroyer: { sank_status: false },
    };
  }
  // If viewer is not playerTwo: (viewer is playerOne or observer)
  if (populatedGame && viewerID != populatedGame.playerTwo?._id) {
    // this syntax for when there is no player two yet.
    // Needs to be != and not !== due to mongoose having its own data types
    const concealedBoard = concealBoard(populatedGame.playerTwoBoard);
    populatedGame.playerTwoBoard = concealedBoard;

    populatedGame.playerTwoShips = {
      carrier: { sank_status: false },
      battleship: { sank_status: false },
      cruiser: { sank_status: false },
      submarine: { sank_status: false },
      destroyer: { sank_status: false },
    };
  }
  return populatedGame;
};

// ============ CONTROLLER ===============================

const BattleshipsController = {
  // ================== METHODS SHARED BY ALL GAMES ============================
  // This Index method only shows the properties of allgames, and no game boards
  Index: (req, res) => {
    // using the select method to hide all gameboard details to prevent cheating.
    Battleships.find()
      .select({
        title: 1,
        endpoint: 1,
        playerOne: 1,
        playerTwo: 1,
        turn: 1,
        winner: 1,
        finished: 1,
      })
      .populate("playerOne", "_id username points")
      .populate("playerTwo", "_id username points")
      .populate("winner", "_id username points")
      .exec((err, battleshipsGames) => {
        if (err) {
          throw err;
        }
        const token = TokenGenerator.jsonwebtoken(req.user_id);
        res.setHeader("Cache-Control", "no-store, no-cache");
        res.status(200).json({ games: battleshipsGames, token: token });
      });
  },

  // This FindByID method conceals the game according to the viewer prior to returning the game data.
  FindByID: (req, res) => {
    const battleshipsID = req.params.id;
    const userID = req.user_id; // userID of the viewer

    // ========= 1) Find the game ====================
    Battleships.findById(battleshipsID)
      .populate("playerOne", "_id username points")
      .populate("playerTwo", "_id username points")
      .populate("winner", "_id username points")
      .exec((err, game) => {
        if (err) {
          throw err;
        }

        // ======== 2) Conceal the boards according to who is looking (playerOne, playerTwo, outsider) ============
        game = concealedGameView(game, userID);
        const token = TokenGenerator.jsonwebtoken(req.user_id);
        res.setHeader("Cache-Control", "no-store, no-cache");
        res.status(200).json({ game: game, token: token });
      });
  },

  Create: async (req, res) => {
    const userID = req.user_id;
    const newBattleships = new Battleships({
      playerOne: userID,
    });

    try {
      const result = await newBattleships.save();
      const populatedBattleships = await Battleships.populate(result, {
        path: "playerOne",
        select: "_id username points",
      });
      await Battleships.populate(populatedBattleships, {
        path: "playerTwo",
        select: "_id username points",
      });
      await Battleships.populate(populatedBattleships, {
        path: "winner",
        select: "_id username points",
      });

      const token = TokenGenerator.jsonwebtoken(req.user_id);
      res.setHeader("Cache-Control", "no-store, no-cache");
      res.status(201).json({ token: token, game: populatedBattleships });
    } catch (error) {
      console.log("Error in TTT.Create", error);
      res.status(501).json(error);
    }
  },

  Join: async (req, res) => {
    const gameID = req.params.id;
    const userID = req.user_id;
    const token = TokenGenerator.jsonwebtoken(req.user_id);

    try {
      const game = await Battleships.findById(gameID)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      if (game.playerTwo) {
        console.log("ERROR: GAME ALREADY FULL");
        return res
          .status(403)
          .json({ error: "Game already full.", game: game, token: token });
      } else {
        const joinedGame = await Battleships.findOneAndUpdate(
          { _id: gameID },
          {
            $set: { playerTwo: userID },
          },
          { new: true }
        )
          .populate("playerOne", "_id username points")
          .populate("playerTwo", "_id username points")
          .populate("winner", "_id username points");

        res.status(200).json({ token: token, game: joinedGame });
      }
    } catch (error) {
      console.log("Error in TTT.Join", error);
      res.status(501).json(error);
    }
  },

  Forfeit: async (req, res) => {
    try {
      const sessionUser = req.user_id;
      const gameID = req.params.id;
      const game = await Battleships.findById(gameID)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Throw error if sessionUser is not in the game:
      if (
        sessionUser != game.playerOne._id &&
        sessionUser != game.playerTwo._id
      ) {
        console.log("ERROR: NON-PARTICIPANTS CANNOT FORFEIT");
        const token = TokenGenerator.jsonwebtoken(req.user_id);
        return res.status(403).json({
          error: "Only players can forfeit the game.",
          // game: game,
          token: token,
        });
      }

      const winner =
        sessionUser == game.playerOne._id
          ? game.playerTwo._id
          : game.playerOne._id;

      const forfeitedGame = await Battleships.findOneAndUpdate(
        { _id: gameID },
        {
          $push: { winner: winner },
          $set: { finished: true },
        },
        { new: true }
      )
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      const token = TokenGenerator.jsonwebtoken(req.user_id);
      res.status(200).json({ token: token, game: forfeitedGame });
    } catch (error) {
      console.error("Error forfeiting: ", error);
      res.status(500).json(error);
    }
  },

  Delete: async (req, res) => {
    try {
      const sessionUser = req.user_id;
      const gameID = req.params.id;
      const game = await Battleships.findById(gameID)
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      const allGames = await Battleships.find()
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Throw error if sessionUser is not playerOne (host)
      if (sessionUser != game.playerOne._id) {
        console.log("ERROR: ONLY HOSTS CAN DELETE GAMES");
        return res.status(403).json({
          error: "Only hosts can delete the game.",
          // game: game,
          games: allGames,
        }); //return the old game & games list so as to not mess up the rendering
      }
      // Throw error if game is full (has playerTwo):
      if (game.playerTwo) {
        console.log("ERROR: CANNOT DELETE NON-OPEN GAMES");
        return res.status(403).json({
          error: "Only games awaiting player Two can be deleted.",
          // game: game,
          games: allGames,
        }); //return the old game & games list so as to not mess up the rendering
      }

      // Delete the game
      await Battleships.findByIdAndDelete(gameID);

      // Get the updated game list
      const updatedGames = await Battleships.find()
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Generate new token
      const token = TokenGenerator.jsonwebtoken(req.user_id);
      res.status(200).json({ token: token, games: updatedGames });
    } catch (error) {
      console.error("Error deleting: ", error);
      res.status(500).json(error);
    }
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
      const shipCodeMap = {
        C: "carrier",
        B: "battleship",
        R: "cruiser",
        U: "submarine",
        D: "destroyer",
      };

      // Find corresponding Board & Shipyard -- case for sessionUser not being in this game is handled in line 285.
      const targetBoardVar =
        userID == game.playerOne ? "playerOneBoard" : "playerTwoBoard";

      const targetBoard =
        userID == game.playerOne ? game.playerOneBoard : game.playerTwoBoard;

      const targetShipyardVar =
        userID == game.playerOne ? "playerOneShips" : "playerTwoShips";

      const targetShipyard =
        userID == game.playerOne ? game.playerOneShips : game.playerTwoShips;

      let updatedBoard = targetBoard;
      let updatedShipyard = targetShipyard;

      console.log("target board: ", targetBoard);

      // Users cannot submit ships if placements already exist
      const emptyBoard = [
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
      if (JSON.stringify(targetBoard) !== JSON.stringify(emptyBoard)) {
        // had to JSON.stringify the two nested arrays to compare content
        console.log("ERROR: SHIPS ALREADY PLACED");
        return res.status(403).json({
          error:
            "Ships have already been placed and/or game has already started. Please reset placements or forfeit.",
          token: token,
        });
      }

      const placedShipsGame = await Battleships.findOneAndUpdate(
        { _id: gameID },
        { $set: { [targetBoardVar]: placements } },
        { new: true }
      )
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // ======== 3) Conceal the boards according to who is looking (playerOne, playerTwo, outsider) ============
      const concealedPlacedShipsGame = concealedGameView(
        placedShipsGame,
        userID
      );
      console.log("Game: ", concealedPlacedShipsGame);

      res.status(200).json({ token: token, game: concealedPlacedShipsGame });
    } catch (error) {
      console.error("Error submitting ship placements: ", error);
      res.status(500).json(error);
    }
  },

  ResetShipPlacements: async (req, res) => {
    const gameID = req.params.id;
    const userID = req.user_id;
    const token = TokenGenerator.jsonwebtoken(req.user_id);

    try {
      // 1) =========== Find the current game and Catch Errors: =================
      const currentGame = await Battleships.findById(gameID); // unpopulated version

      // Game not found
      if (!currentGame) {
        return res.status(404).json({ error: "Game not found" });
      }

      // Users cannot reset if they are not in the game
      if (userID != currentGame.playerOne && userID != currentGame.playerTwo) {
        console.log("ERROR: YOU'RE NOT IN THIS GAME");
        return res
          .status(403)
          .json({ error: "You are not in this game", token: token });
      }

      // Users cannot reset if the opponent has also submitted their ship placements
      // Find corresponding Board & Shipyard -- case for sessionUser not being in this game is handled in line 285.
      // TODO figure out gameReady system
      if (currentGame.ready === true) {
        // had to JSON.stringify the two nested arrays to compare content
        console.log("ERROR: GAME ALREADY STARTED");
        return res.status(403).json({
          error: "Game already started.",
          token: token,
        });
      }

      // 2) =========== Reset the corresponding player's board & shipyard: ====================
      const boardToReset =
        userID == currentGame.playerOne ? "playerOneBoard" : "playerTwoBoard"; // must be == instead of ===

      const shipyardToReset =
        userID == currentGame.playerOne ? "playerOneShips" : "playerTwoShips"; // must be == instead of ===

      // A) Resetted board & shipyard
      const emptyBoard = Array.from({ length: 10 }, () =>
        Array.from({ length: 10 }, () => "")
      );
      const unplacedShips = {
        carrier: { sank_status: false, units: [] },
        battleship: { sank_status: false, units: [] },
        cruiser: { sank_status: false, units: [] },
        submarine: { sank_status: false, units: [] },
        destroyer: { sank_status: false, units: [] },
      };

      // B) Reset the corresponding player's board
      const resetPlacementsGame = await Battleships.findOneAndUpdate(
        { _id: gameID },
        {
          $set: {
            [boardToReset]: emptyBoard,
            [shipyardToReset]: unplacedShips,
          },
        },
        { new: true }
      )
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // ======== 3) Conceal the boards according to who is looking (playerOne, playerTwo, outsider) ============
      const concealedResetGame = concealedGameView(resetPlacementsGame, userID);
      console.log("Concealed Game: ", concealedResetGame);

      res.status(200).json({ token: token, game: concealedResetGame });
    } catch (error) {
      console.error("Error resetting ship placements: ", error);
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

    try {
      // 1) =========== Find the current game and Catch Errors: =================
      const currentGame = await Battleships.findById(gameID);

      // Cannot launch if it is not your turn
      // Cannot launch if you are not in this game
      // Cannot launch in an explored space
      // Cannot launch out of bounds

      // 2) ============= Launch the missile & get the updated game data ==================
      const targettedBoardVar =
        userID == currentGame.playerOne ? "playerTwoBoard" : "playerOneBoard";

      const targettedBoard =
        userID == currentGame.playerOne
          ? currentGame.playerTwoBoard
          : currentGame.playerOneBoard;

      const targettedShipyardVar =
        userID == currentGame.playerOne ? "playerTwoShips" : "playerOneShips";

      const targettedShipyard =
        userID == currentGame.playerOne
          ? currentGame.playerTwoShips
          : currentGame.playerOneShips;

      // -------- HIT ----------------------
      if (shipCodes.includes(targettedBoard[row][col])) {
        // -------- MISS -----------------------
      } else {
        targettedBoard[row][col] = "/";

        const missedGame = await Battleships.findOneAndUpdate(
          { _id: gameID },
          {
            $set: { [targettedBoardVar]: targettedBoard },
            $inc: { turn: 1 },
          },
          { new: true }
        )
          .populate("playerOne", "_id username points")
          .populate("playerTwo", "_id username points")
          .populate("winner", "_id username points");

        const concealedGame = concealedGameView(missedGame, userID);
        console.log("Missed Game: ", concealedGame);
        res.setHeader("Cache-Control", "no-store, no-cache");
        res.status(200).json({
          game: concealedGame,
          token: token,
          message: "MISSED",
        });
      }
    } catch (error) {
      console.error("Error placing piece: ", error);
      res.status(500).json(error);
    }

    // // -------- HIT ----------------------
    // if (currentGame.targettedBoard[row][col] === "s") {
    //   // A) Update the corresponding space on the board
    //   currentGame.targettedBoard[row][col] = "X";
    //   // B) Check for sank ships & update ships

    //   // C) Check for wins & update --> if every ship.sank === true
    //   // D) Return game
    //   // -------- MISS -----------------------
    // } else if (targettedSpace === "") {
    //   // Update targetted space
    // }
    //   res.status(200).json({ token: token, game: currentGame });
    // } catch (error) {
    //   console.error("Error placing piece: ", error);
    //   res.status(500).json(error);
    // }
  },
};

module.exports = BattleshipsController;
