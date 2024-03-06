const RockPaperScissors = require("../models/rockpaperscissors");
const TokenGenerator = require("../lib/token_generator");
const { TokenExpiredError } = require("jsonwebtoken");
const GamesController = require("./games");

// TODO ADD IN GAME CONTROLLER FOR WIN CONDITIONS
// TODO Add points for this game if there is a win condition
// test codespaces

// ============ HELPER FUNCTIONS FOR CONCEALMENT: ===================
const concealedRockPaperScissorsView = (populatedGame, viewerID) => {
  // All concealment occurs in the backend before the final game data is returned, rather than in the frontend display methods, so that players cannot cheat by inspecting the data.
  // If the viewer is not the owner of a player's hand AND the round is not yet submitted, the viewer will not see the player's hand, only that they have submitted a hand.
  // If the game is over (finished === true): no concealment occurs and the function returns the original populatedGame.

  // The structure below allows for concealment for both opponents and observers.
  const concealHand = (hand) => {
    const SUBMITTED = "submitted";
    const NOTSUBMITTED = null;

    if (hand) {
      return SUBMITTED;
    } else {
      return NOTSUBMITTED;
    }
  };

  if (
    populatedGame &&
    !populatedGame.finished &&
    !populatedGame.currentRound.outcome
  ) {
    // If viewer is not playerOne: (viewer is playerTwo or observer)
    if (viewerID != populatedGame.playerOne._id) {
      // Needs to be != and not !== due to mongoose having its own data types
      const concealedHand = concealHand(
        populatedGame.currentRound.playerOneChoice
      );
      populatedGame.currentRound.playerOneChoice = concealedHand;
    }

    // If viewer is not playerTwo: (viewer is playerOne or observer)
    if (viewerID != populatedGame.playerTwo?._id) {
      // this syntax for when there is no player two yet.
      // Needs to be != and not !== due to mongoose having its own data types
      const concealedHand = concealHand(
        populatedGame.currentRound.playerTwoChoice
      );
      populatedGame.currentRound.playerTwoChoice = concealedHand;
    }
  }
  return populatedGame;
};

// ============ CONTROLLER ===============================
const RockPaperScissorsController = {
  // ================== METHODS SHARED BY ALL GAMES ============================
  // Method to fetch all RockPaperScissors games
  Index: (req, res) => {
    GamesController.Index(
      req,
      res,
      RockPaperScissors,
      concealedRockPaperScissorsView
    );
  },

  // Method to fetch a specific RockPaperScissors game by ID
  FindByID: (req, res) => {
    GamesController.FindByID(
      req,
      res,
      RockPaperScissors,
      concealedRockPaperScissorsView
    );
  },

  // Method to create a new RockPaperScissors game
  Create: async (req, res) => {
    GamesController.Create(req, res, RockPaperScissors);
  },

  // Method to join a RockPaperScissors game
  Join: async (req, res) => {
    GamesController.Join(
      req,
      res,
      RockPaperScissors,
      concealedRockPaperScissorsView
    );
  },

  // Method to forfeit a RockPaperScissors game
  Forfeit: async (req, res) => {
    GamesController.Forfeit(
      req,
      res,
      RockPaperScissors,
      concealedRockPaperScissorsView
    );
  },

  // Method to delete a RockPaperScissors game
  Delete: async (req, res) => {
    GamesController.Delete(
      req,
      res,
      RockPaperScissors,
      concealedRockPaperScissorsView
    );
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
