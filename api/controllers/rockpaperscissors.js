const RockPaperScissors = require("../models/rockpaperscissors");
const TokenGenerator = require("../lib/token_generator");
const { TokenExpiredError } = require("jsonwebtoken");
// TODO ADD IN GAME CONTROLLER FOR WIN CONDITIONS
// TODO Add points for this game if there is a win condition

// ============ HELPER FUNCTIONS FOR CONCEALMENT: ===================
const concealedGameView = (populatedGame, viewerID) => {
  // All concealment occurs in the backend before the final game data is returned, rather than in the frontend display methods, so that players cannot cheat by inspecting the data.
  // If the viewer is not the owner of a board or shipyard, they will get a concealed version of each.
  // If the game is over (finished === true): no concealment occurs and the function returns the original populatedGame.

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
const RockPaperScissorsController = {
  // ================== METHODS SHARED BY ALL GAMES ============================
  // This Index method only shows the properties of allgames, and rounds
  Index: (req, res) => {
    // using the select method to hide all gameboard details to prevent cheating.
    RockPaperScissors.find()
      .select({
        title: 1,
        endpoint: 1,
        playerOne: 1,
        playerTwo: 1,
        winner: 1,
        finished: 1,
        round: 1,
      })
      .populate("playerOne", "_id username points")
      .populate("playerTwo", "_id username points")
      .populate("winner", "_id username points")
      .exec((err, rockpaperscissorsGames) => {
        if (err) {
          throw err;
        }
        const token = TokenGenerator.jsonwebtoken(req.user_id);
        res.setHeader("Cache-Control", "no-store, no-cache");
        res.status(200).json({ games: rockpaperscissorsGames, token: token });
      });
  },

  // This FindByID method conceals the game according to the viewer prior to returning the game data.
  FindByID: (req, res) => {
    const rockpaperscissorsID = req.params.id;
    const userID = req.user_id; // userID of the viewer
    const token = TokenGenerator.jsonwebtoken(req.user_id);

    // ========= 1) Find the game ====================
    RockPaperScissors.findById(rockpaperscissorsID)
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
    const newRockPaperScissors = new RockPaperScissors({
      playerOne: userID,
    });

    try {
      const result = await newRockPaperScissors.save();
      const populatedRockPaperScissors = await RockPaperScissors.populate(
        result,
        {
          path: "playerOne",
          select: "_id username points",
        }
      );
      await RockPaperScissors.populate(populatedRockPaperScissors, {
        path: "playerTwo",
        select: "_id username points",
      });
      await RockPaperScissors.populate(populatedRockPaperScissors, {
        path: "winner",
        select: "_id username points",
      });

      const token = TokenGenerator.jsonwebtoken(req.user_id);
      res.setHeader("Cache-Control", "no-store, no-cache");
      res.status(201).json({ token: token, game: populatedRockPaperScissors });
    } catch (error) {
      console.log("Error in RPS.Create", error);
      res.status(501).json(error);
    }
  },

  Join: async (req, res) => {
    const gameID = req.params.id;
    const userID = req.user_id;
    const token = TokenGenerator.jsonwebtoken(req.user_id);

    try {
      const game = await RockPaperScissors.findById(gameID);

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
        const joinedGame = await RockPaperScissors.findOneAndUpdate(
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
        const concealedGame = concealedGameView(joinedGame, userID);
        res.setHeader("Cache-Control", "no-store, no-cache");
        res.status(200).json({ token: token, game: concealedGame });
      }
    } catch (error) {
      console.log("Error in RPS.Join", error);
      res.status(500).json(error);
    }
  },

  Forfeit: async (req, res) => {
    try {
      const sessionUser = req.user_id;
      const gameID = req.params.id;
      const token = TokenGenerator.jsonwebtoken(req.user_id);
      const game = await RockPaperScissors.findById(gameID);

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

      const forfeitedGame = await RockPaperScissors.findOneAndUpdate(
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
      const concealedGame = concealedGameView(forfeitedGame, sessionUser);
      res.setHeader("Cache-Control", "no-store, no-cache");
      res.status(200).json({ token: token, game: concealedGame });
    } catch (error) {
      console.error("Error forfeiting: ", error);
      res.status(500).json(error);
    }
  },

  Delete: async (req, res) => {
    try {
      const sessionUser = req.user_id;
      const gameID = req.params.id;
      const token = TokenGenerator.jsonwebtoken(req.user_id);
      const game = await RockPaperScissors.findById(gameID);

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
      await RockPaperScissors.findByIdAndDelete(gameID);

      // Get the updated game list
      const updatedGames = await RockPaperScissors.find()
        .select({
          title: 1,
          endpoint: 1,
          playerOne: 1,
          playerTwo: 1,
          winner: 1,
          finished: 1,
          round: 1,
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

  // ===================== ROCK PAPER SCISSORS SPECIFIC GAMEPLAY METHODS ============================
  SubmitChoice: async (req, res) => {
    const gameID = req.params.id;
    const userID = req.user_id;
    const choice = req.body.choice; // "R", "P", "S"
    const token = TokenGenerator.jsonwebtoken(req.user_id);

    try {
      // 1) =========== Find the current game and Catch Errors: =================
      const game = await RockPaperScissors.findById(gameID);

      // Game not found
      if (!game) {
        return res.status(404).json({ error: "Game not found", token: token });
      }

      // Users cannot submit choice if they are not in the game.
      if (userID != game.playerOne && userID != game.playerTwo) {
        // needs to be != due to Mongoose datatypes
        console.log("ERROR: YOU'RE NOT IN THIS GAME");
        return res
          .status(403)
          .json({ error: "Observers cannot play", token: token });
      }

      // Users cannot submit choice without a playerTwo
      if (!game.playerTwo) {
        console.log("ERROR: AWAITING PLAYER TWO");
        return res.status(403).json({
          error: "Cannot play till player two joins.",
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

      // Users cannot submit if they have already made a choice
      const roundIndex = game.currentRound - 1;
      const userPlayerStr =
        userID == game.playerOne ? "playerOne" : "playerTwo";
      const userRoundChoice = game.rounds[roundIndex][userPlayerStr + "Choice"];

      if (userRoundChoice) {
        console.log("ERROR: ALREADY MADE CHOICE");
        return res.status(403).json({
          error: "Choice already made.",
          token: token,
        });
      }

      // 2) =========== Check opponent's choice and check round and game winner: ===============
      let roundOutcome;

      const opponentPlayerStr =
        userID == game.playerOne ? "playerTwo" : "playerOne";
      const opponentRoundChoice =
        game.rounds[roundIndex][opponentPlayerStr + "Choice"];

      if (opponentRoundChoice) {
        // Update the working game with the sessionUsers's choice:
        game.rounds[roundIndex][userPlayerStr + "Choice"] = choice;

        // Check for round win
        const findRoundWinner = (game) => {
          let winner;
          const currentIndex = game.currentRound;
          const round = game.rounds[currentIndex];

          if (round.playerOneChoice === round.playerTwoChoice) {
            return "Draw";
          }

          if (
            (round.playerOneChoice === "R" && round.playerTwoChoice === "S") ||
            (round.playerOneChoice === "S" && round.playerTwoChoice === "P") ||
            (round.playerOneChoice === "P" && round.playerTwoChoice === "R")
          ) {
            return game.playerOne;
          } else {
            return game.playerTwo;
          }
        };

        roundOutcome = findRoundWinner(game);
        game.rounds.roundIndex.outcome = roundOutcome;

        // If currentRound === maxRounds, find the winner;
        if (game.currentRound === game.maxRounds) {
          
        } else {
          // Else increment the currentRound
          const updatedGame = await RockPaperScissors.findOneAndUpdate(
            { _id: gameID },
            {
              $set: {
                [`rounds.${roundIndex}.${userPlayerStr}Choice`]: choice,
                [`rounds.${roundIndex}.outcome`]: roundOutcome,
              },
            },
            { new: true }
          )
            .populate("playerOne", "_id username points")
            .populate("playerTwo", "_id username points")
            .populate("winner", "_id username points");
        }
      } else {
        // Update the game with the users's choice
        const updatedGame = await RockPaperScissors.findOneAndUpdate(
          { _id: gameID },
          {
            $set: { [`rounds.${roundIndex}.${userPlayerStr}Choice`]: choice },
          },
          { new: true }
        )
          .populate("playerOne", "_id username points")
          .populate("playerTwo", "_id username points")
          .populate("winner", "_id username points");
      }

      // ======== 3) Conceal the boards according to who is looking (playerOne, playerTwo, outsider) ============
      const concealedGame = concealedGameView(updatedGame, userID);
      res.setHeader("Cache-Control", "no-store, no-cache");
      res.status(200).json({ token: token, game: concealedGame });
    } catch (error) {
      console.error("Error submitting ship choice: ", error);
      res.status(500).json(error);
    }
  },
};

module.exports = RockPaperScissorsController;
