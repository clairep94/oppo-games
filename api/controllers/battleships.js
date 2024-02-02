const Battleships = require("../models/battleships");
const TokenGenerator = require("../lib/token_generator");
// TODO ADD IN GAME CONTROLLER FOR WIN CONDITIONS
// TODO Add points for this game if there is a win condition

const BattleshipsController = {
  // ================== METHODS SHARED BY ALL GAMES ============================
  Index: (req, res) => {
    // TODO change this to a concealed board method too?
    Battleships.find()
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
          game: game,
          token: token,
        }); //return the old game so as to not mess up the rendering
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
          game: game,
          games: allGames,
        }); //return the old game & games list so as to not mess up the rendering
      }
      // Throw error if game is full (has playerTwo):
      if (game.playerTwo) {
        console.log("ERROR: CANNOT DELETE NON-OPEN GAMES");
        return res.status(403).json({
          error: "Only games awaiting player Two can be deleted.",
          game: game,
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

  // ======= This findByID method includes an extra concealBoard function necessary for battleships =========
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
        // If the viewer is NOT the owner of the board (ie. a spectator or the opponent), they will get a concealed version of the board
        // This concealed version checks for "s" and converts it to "".
        // This concealment occurs in the backend before the final game data is returned, rather than in the frontend display methods, so that players cannot cheat by inspecting the data.

        const concealBoard = (board) => {
          // Iterate over all spaces and change all spaces with "s" to ""
          for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
              if (board[i][j] === "s") {
                board[i][j] = "";
              }
            }
          }
          return board;
        };

        // Conceal playerOneBoard if viewer is not playerOne:
        if (game && userID != game.playerOne._id) {
          // Needs to be != and not !== due to mongoose having its own data types
          const concealedBoard = concealBoard(game.playerOneBoard);
          game.playerOneBoard = concealedBoard;
        }
        // Conceal playerTwoBoard if viewer is not playerTwo:
        if (game && userID != game.playerTwo?._id) {
          // Needs to be != and not !== due to mongoose having its own data types
          const concealedBoard = concealBoard(game.playerTwoBoard);
          game.playerTwoBoard = concealedBoard;
        }

        // TODO: Add this method then refactor
        // ======= 3) Conceal the ships according to who is looking (playerOne, playerTwo, outsider) ============
        // If the viewer is NOT the owner of the shipyard (ie. a spectator or the opponent), they will get a concealed version of the shipyard
        // This concealed version checks for units and converts to an empty array
        // This concealment occurs in the backend before the final game data is returned, rather than in the frontend display methods, so that players cannot cheat by inspecting the data.

        const token = TokenGenerator.jsonwebtoken(req.user_id);
        res.setHeader("Cache-Control", "no-store, no-cache");
        res.status(200).json({ game: game, token: token });
      });
  },

  // ======= PLACING SHIPS ============
  SubmitShipPlacements: async (req, res) => {
    const gameID = req.params.id;
    const userID = req.user_id;
    const placements = req.body.placements; // See models/battleships lines 103-115 for useage / format
    const token = TokenGenerator.jsonwebtoken(req.user_id);

    try {
      // 1) =========== Find the current game and Catch Errors: =================
      const game = await Battleships.findById(gameID);

      // Users cannot submit placements if they are not in the game.
      if (userID != game.playerOne && userID != game.playerTwo) {
        console.log("ERROR: YOU'RE NOT IN THIS GAME");
        return res
          .status(403)
          .json({ error: "Observers cannot place ships", token: token });
      }

      // Users cannot submit on completed games.
      if (game.finished === true) {
        console.log("ERROR: GAME FINISHED");
        return res
          .status(403)
          .json({ error: "Game already finished.", token: token });
      }

      // Users cannot submit placements without a playerTwo
      if (!game.playerTwo) {
        console.log("ERROR: AWAITING PLAYER TWO");
        return res.status(403).json({
          error: "Cannot place ships till player two joins.",
          token: token,
        });
      }

      // Users cannot submit ship placements if ships have already been placed --> all ship placements are submitted at once.
      // Users cannot submit incomplete ship placements

      // 2) =========== Update the user's board with the ship placements: =================
      const shipCodeMap = {
        C: "carrier",
        B: "battleship",
        R: "cruiser",
        S: "submarine",
        D: "destroyer",
      };

      // Find corresponding Board & Shipyard -- case for sessionUser not being in this game is handled in line 263.
      const targetBoardVar =
        userID == game.playerOne ? "playerOneBoard" : "playerTwoBoard";

      const targetBoard =
        userID == game.playerOne ? game.playerOneBoard : game.playerTwoBoard;
      // console.log("board: ", JSON.stringify(targetBoard));

      const targetShipyardVar =
        userID == game.playerOne ? "playerOneShips" : "playerTwoShips";

      const targetShipyard =
        userID == game.playerOne ? game.playerOneShips : game.playerTwoShips;
      // console.log("shipyard: ", JSON.stringify(targetShipyard));

      let updatedBoard = targetBoard;
      let updatedShipyard = targetShipyard;

      // Check each space in the placements board & check for keys in the shipCodeMap
      for (let i = 0; i < placements.length; i++) {
        for (let j = 0; j < placements[i].length; j++) {
          if (placements[i][j] in shipCodeMap) {
            // Append the corresponding shipType.units with {hit_status: false, units: [rowIndex, colIndex]}
            const shipType = shipCodeMap[placements[i][j]];
            updatedShipyard[shipType].units.push({
              hit_status: false,
              units: [i, j],
            });

            // Update the corresponding player's board space with "s"
            updatedBoard[i][j] = "s";
          }
        }
      }

      const placedShipsGame = await Battleships.findOneAndUpdate(
        { _id: gameID },
        {
          $set: {
            [targetBoardVar]: updatedBoard,
            [targetShipyardVar]: updatedShipyard,
          },
        },
        { new: true }
      )
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");
      console.log(JSON.stringify(placedShipsGame.playerOneShips));
      res.status(200).json({ token: token, game: placedShipsGame });
    } catch (error) {
      console.error("Error submitting ship placements: ", error);
      res.status(500).json(error);
    }
  },

  // ======= RESET PLACEMENTS ============
  ResetShipPlacements: async (req, res) => {
    const gameID = req.params.id;
    const userID = req.user_id;

    try {
      // 1) =========== Find the current game and Catch Errors: =================
      const currentGame = Battleships.findById(gameID) // TODO populated version?
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // Users cannot reset if the opponent has also submitted their ship placements
      // Users cannot reset if they are not in the game

      // 2) =========== Reset the corresponding player's board: ====================
      const boardToReset =
        userID === currentGame.playerOne._id
          ? "playerTwoBoard"
          : "playerOneBoard";
      const boardResetObj = { sank_status: false, units: [] };

      const resetPlacementsGame = await Battleships.findOneAndUpdate(
        { _id: gameID },
        {
          $set: {
            [boardToReset]: {
              carrier: boardResetObj,
              battleship: boardResetObj,
              cruiser: boardResetObj,
              submarine: boardResetObj,
              destroyer: boardResetObj,
            },
          },
        },
        { new: true }
      )
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      const token = TokenGenerator.jsonwebtoken(req.user_id);
      res.status(200).json({ token: token, game: resetPlacementsGame });
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

    try {
      // 1) ============= Find the current game and Catch Errors: =================
      const currentGame = Battleships.findById(gameID) // TODO populated version?
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      const token = TokenGenerator.jsonwebtoken(req.user_id);

      // Cannot launch if it is not your turn
      // Cannot launch if you are not in this game
      // Cannot launch in an explored space
      // Cannot launch out of bounds

      // 2) ============= Launch the missile & get the updated game data ==================
      const targettedBoard =
        userID === currentGame.playerOne._id
          ? "playerTwoBoard"
          : "playerOneBoard";
      const targettedSpace = currentGame.targettedBoard.row.col;

      // -------- HIT ----------------------
      if (targettedSpace === "s") {
        // A) Update targetted space
        // B) Check for sank ships & update ships
        const targettedShips =
          userID === currentGame.playerOne._id
            ? "playerTwoShips"
            : "playerOneShips";

        // C) Check for wins & update --> if every ship.sank === true

        // D) Return game

        // -------- MISS -----------------------
      } else if (targettedSpace === "") {
        // Update targetted space
      }
    } catch (error) {
      console.error("Error placing piece: ", error);
      res.status(500).json(error);
    }
  },
};

module.exports = BattleshipsController;
