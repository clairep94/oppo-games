const TokenGenerator = require("../lib/token_generator");
const { TokenExpiredError } = require("jsonwebtoken");
// TODO ADD IN GAME CONTROLLER FOR WIN CONDITIONS
// TODO Add points for this game if there is a win condition

// Default concealment function that returns the original game data
const defaultConcealmentFunction = (game, viewerID) => {
  return game;
};

const GamesController = {
  // ================== METHODS SHARED BY ALL GAMES ============================
  // This Index method only shows the properties of allgames, and no game boards
  Index: (req, res, GameModel) => {
    // using the select method to hide all gameboard details to prevent cheating.
    GameModel.find()
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
      .exec((err, games) => {
        if (err) {
          throw err;
        }
        const token = TokenGenerator.jsonwebtoken(req.user_id);
        res.setHeader("Cache-Control", "no-store, no-cache");
        res.status(200).json({ games: games, token: token });
      });
  },

  // This FindByID method conceals the game according to the viewer prior to returning the game data.
  FindByID: (
    req,
    res,
    GameModel,
    concealmentFunction = defaultConcealmentFunction
  ) => {
    const gameID = req.params.id;
    const userID = req.user_id; // userID of the viewer
    const token = TokenGenerator.jsonwebtoken(req.user_id);

    // ========= 1) Find the game ====================
    GameModel.findById(gameID)
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
        game = concealmentFunction(game, userID);
        res.setHeader("Cache-Control", "no-store, no-cache");
        res.status(200).json({ game: game, token: token });
      });
  },

  Create: async (req, res, GameModel) => {
    const userID = req.user_id;
    const newGame = new GameModel({
      playerOne: userID,
    });

    try {
      const result = await newGame.save();
      const populatedGames = await GameModel.populate(result, {
        path: "playerOne",
        select: "_id username points",
      });
      await GameModel.populate(populatedGames, {
        path: "playerTwo",
        select: "_id username points",
      });
      await GameModel.populate(populatedGames, {
        path: "winner",
        select: "_id username points",
      });

      const token = TokenGenerator.jsonwebtoken(req.user_id);
      res.setHeader("Cache-Control", "no-store, no-cache");
      res.status(201).json({ token: token, game: populatedGames });
    } catch (error) {
      console.log("Error in Game.Create", error);
      res.status(501).json(error);
    }
  },

  Join: async (
    req,
    res,
    GameModel,
    concealmentFunction = defaultConcealmentFunction
  ) => {
    const gameID = req.params.id;
    const userID = req.user_id;
    const token = TokenGenerator.jsonwebtoken(req.user_id);

    try {
      const game = await GameModel.findById(gameID);

      // Game not found error
      if (!game) {
        return res.status(404).json({ error: "Game not found", token: token });
      }
      // Already joined game error
      if (
        userID == game.playerOne ||
        (game.playerTwo && game.playerTwo == userID)
      ) {
        console.log("ERROR: ALREADY IN THIS GAME");
        return res
          .status(403)
          .json({ error: "Already in this game", token: token });
      }
      // Game is full error
      if (game.playerTwo) {
        console.log("ERROR: GAME ALREADY FULL");
        return res
          .status(403)
          .json({ error: "Game already full.", token: token });
      } else {
        // Join game
        const joinedGame = await GameModel.findOneAndUpdate(
          { _id: gameID },
          {
            $set: { playerTwo: userID },
          },
          { new: true }
        )
          .populate("playerOne", "_id username points")
          .populate("playerTwo", "_id username points")
          .populate("winner", "_id username points");

        // ======== Conceal the boards according to who is looking (playerOne, playerTwo, outsider) ============
        const concealedGame = concealmentFunction(joinedGame, userID);
        res.setHeader("Cache-Control", "no-store, no-cache");
        res.status(200).json({ token: token, game: concealedGame });
      }
    } catch (error) {
      console.log("Error in Game.Join", error);
      res.status(500).json(error);
    }
  },

  Forfeit: async (
    req,
    res,
    GameModel,
    concealmentFunction = defaultConcealmentFunction
  ) => {
    try {
      const sessionUser = req.user_id;
      const gameID = req.params.id;
      const token = TokenGenerator.jsonwebtoken(req.user_id);
      const game = await GameModel.findById(gameID);

      // Game not found error
      if (!game) {
        return res.status(404).json({ error: "Game not found", token: token });
      }
      // Game aready finished error
      if (game.finished) {
        console.log("ERROR: GAME ALREADY FINISHED");
        return res.status(403).json({
          error: "Game already finished.",
          token: token,
        });
      }
      if (!game.playerTwo) {
        console.log("ERROR: AWAITING PLAYER TWO");
        return res.status(403).json({
          error: "Awaiting player two. Please delete instead.",
          token: token,
        });
      }

      // Throw error if sessionUser is not in the game:
      if (sessionUser != game.playerOne && sessionUser != game.playerTwo) {
        // needs to be != due to Mongoose datatypes
        console.log("ERROR: NON-PARTICIPANTS CANNOT FORFEIT");
        return res.status(403).json({
          error: "Only players can forfeit the game.",
          token: token,
        });
      }
      // needs to be ==  not === due to Mongoose datatypes
      const winner =
        sessionUser == game.playerOne ? game.playerTwo : game.playerOne;

      const forfeitedGame = await GameModel.findOneAndUpdate(
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

      // ======== Conceal the boards according to who is looking (playerOne, playerTwo, outsider) ============
      const concealedGame = concealmentFunction(forfeitedGame, sessionUser);
      res.setHeader("Cache-Control", "no-store, no-cache");
      res.status(200).json({ token: token, game: concealedGame });
    } catch (error) {
      console.error("Error forfeiting: ", error);
      res.status(500).json(error);
    }
  },

  Delete: async (
    req,
    res,
    GameModel,
    concealmentFunction = defaultConcealmentFunction
  ) => {
    try {
      const sessionUser = req.user_id;
      const gameID = req.params.id;
      const token = TokenGenerator.jsonwebtoken(req.user_id);
      const game = await GameModel.findById(gameID);

      // Game not found error
      if (!game) {
        return res.status(404).json({ error: "Game not found", token: token });
      }
      // Throw error if sessionUser is not playerOne (host)
      if (sessionUser != game.playerOne) {
        // needs to be != due to Mongoose datatypes
        console.log("ERROR: ONLY HOSTS CAN DELETE GAMES");
        return res.status(403).json({
          error: "Only hosts can delete the game.",
          token: token,
        });
      }
      // Throw error if game is full (has playerTwo):
      if (game.playerTwo) {
        console.log("ERROR: CANNOT DELETE NON-OPEN GAMES");
        return res.status(403).json({
          error: "Only games awaiting player Two can be deleted.",
          token: token,
        });
      }

      // Delete the game
      await GameModel.findByIdAndDelete(gameID);

      // Get the updated game list
      const updatedGames = await GameModel.find()
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
        .populate("winner", "_id username points");

      res.setHeader("Cache-Control", "no-store, no-cache");
      res.status(200).json({ token: token, games: updatedGames });
    } catch (error) {
      console.error("Error deleting: ", error);
      res.status(500).json(error);
    }
  },
};

module.exports = GamesController;
