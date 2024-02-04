const Battleships = require("../models/battleships");
const TokenGenerator = require("../lib/token_generator");
const { TokenExpiredError } = require("jsonwebtoken");
// TODO ADD IN GAME CONTROLLER FOR WIN CONDITIONS
// TODO Add points for this game if there is a win condition

// ============ HELPER FUNCTIONS FOR CONCEALMENT: ===================
const concealedGameView = (populatedGame, viewerID) => {
  // All concealment occurs in the backend before the final game data is returned, rather than in the frontend display methods, so that players cannot cheat by inspecting the data.
  // If the viewer is not the owner of a board or shipyard, they will get a concealed version of each.

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
      populatedGame.playerOnePlacements = null;
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
      populatedGame.playerTwoPlacements = null;
    }
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
    const token = TokenGenerator.jsonwebtoken(req.user_id);

    // ========= 1) Find the game ====================
    Battleships.findById(battleshipsID)
      .populate("playerOne", "_id username points")
      .populate("playerTwo", "_id username points")
      .populate("winner", "_id username points")
      .exec((err, game) => {
        if (err) {
          throw err;
        }

        // Game not found
        if (!game) {
          return res
            .status(404)
            .json({ error: "Game not found", token: token });
        }

        // ======== 2) Conceal the boards according to who is looking (playerOne, playerTwo, outsider) ============
        game = concealedGameView(game, userID);
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

      // Find corresponding Board for the sessionUser -- case for sessionUser not being in this game is handled in line 285.
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
      const concealedPlacedShipsGame = concealedGameView(
        placedShipsGame,
        userID
      );
      console.log("Submitted Placements Game: ", concealedPlacedShipsGame);

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

      // Game not found
      if (!currentGame) {
        return res.status(404).json({ error: "Game not found", token: token });
      }

      // Users cannot submit placements if they are not in the game.
      if (userID != currentGame.playerOne && userID != currentGame.playerTwo) {
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
        userID == currentGame.playerOne ? "playerTwo" : "playerOne";
      const targettedBoardVar = targetStr + "Board";
      const targettedBoard = currentGame[targettedBoardVar];
      const targettedShipyardVar = targetStr + "Ships";
      const targettedShipyard = currentGame[targettedShipyardVar];

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

      const concealedGame = concealedGameView(updatedGame, userID);
      const shownGame = message === "WIN" ? updatedGame : concealedGame; // If game is won, reveal the ships
      res.setHeader("Cache-Control", "no-store, no-cache");
      res.status(200).json({
        game: shownGame,
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
