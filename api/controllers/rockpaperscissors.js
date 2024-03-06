const RockPaperScissors = require("../models/rockpaperscissors");
const TokenGenerator = require("../lib/token_generator");
const { TokenExpiredError } = require("jsonwebtoken");
const GamesController = require("./games");

// TODO ADD IN GAME CONTROLLER FOR WIN CONDITIONS
// TODO Add points for this game if there is a win condition

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

  // GAMEPLAY STEPS:
  // PlayerA chooses hand -> FE: "Are you sure?" (cannot choose again once AreYouSure confirmed)
  // PlayerB chooses hand -> FE: "Are you sure?" (cannot choose again once AreYouSure confirmed)
  // FE: Animation of RPS once currentRound.playerOneChoice && currentRound.playerTwoChoice
  // Find currentRound winner
  // Append currentRound to finishedRounds & clear currentRound
  // If maxRounds == finishedRounds.length -> Find overall winner and finish the game
  // Else: clear currentRound, turn ++

  SubmitChoice: async (req, res) => {
    const gameID = req.params.id;
    const userID = req.user_id;
    const choice = req.body.choice; // "R", "P", "S"
    const token = TokenGenerator.jsonwebtoken(req.user_id);
    let message;

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

      // Users cannot submit on completed games (won or forfeited).
      if (game.finished === true) {
        console.log("ERROR: GAME FINISHED");
        return res
          .status(403)
          .json({ error: "Game already finished.", token: token });
      }

      // Users cannot submit choice without a playerTwo
      if (!game.playerTwo) {
        console.log("ERROR: AWAITING PLAYER TWO");
        return res.status(403).json({
          error: "Cannot play till player two joins.",
          token: token,
        });
      }

      // 2) =========== Update the SessionUser's choice for the currentRound: =================
      // Users cannot submit if they have already made a choice
      // Update userRoundChoice if !userRoundChoice
      const userPlayerStr =
        userID == game.playerOne ? "playerOne" : "playerTwo";
      const userRoundChoice = game.currentRound[userPlayerStr + "Choice"];

      if (userRoundChoice) {
        console.log("ERROR: ALREADY MADE CHOICE");
        return res.status(403).json({
          error: "Choice already made.",
          token: token,
        });
      } else {
        // Update currentRound's playerChoice with the choice
        game.currentRound[userPlayerStr + "Choice"] = choice;
        message = `Hand Selected: ${choice}`;
      }

      // 3) =========== Check opponent's choice and find the currentRound outcome: ===============
      const opponentPlayerStr =
        userID == game.playerOne ? "playerTwo" : "playerOne";
      const opponentRoundChoice =
        game.currentRound[opponentPlayerStr + "Choice"];

      let roundOutcome;

      // If opponentRoundChoice, find the winner, find the outcome, add to finishedRounds
      if (opponentRoundChoice) {
        const findRoundOutcome = (round) => {
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

        roundOutcome = findRoundOutcome(game.currentRound); // find the round outcome
        game.currentRound.outcome = roundOutcome; // update the currentRound outcome
        game.finishedRounds.push(game.currentRound); // push the currentRound to finishedRounds

        message = {
          round: game.finishedRounds.length,
          playerOneChoice: game.currentRound.playerOneChoice,
          playerTwoChoice: game.currentRound.playerTwoChoice,
          outcome: game.currentRound.outcome,
        };

        game.currentRound = {
          playerOneChoice: null,
          playerTwoChoice: null,
          outcome: null,
        }; // clear currentRound
        game.turn++;
      }

      // 4) =========== Check if end of all rounds, if so find the overall game outcome: ===============
      const isEndOfRounds = game.maxRounds == game.finishedRounds.length;
      if (isEndOfRounds) {
        playerOneCount = 0;
        playerTwoCount = 0;

        for (let i = 0; i < game.maxRounds; i++) {
          let round = game.finishedRounds[i];
          if (round.outcome == game.playerOne) {
            playerOneCount++;
          } else if (round.outcome == game.playerTwo) {
            playerTwoCount++;
          } else {
            // Draw, do nothing
          }
        }

        if (playerOneCount == playerTwoCount) {
          // Draw
          game.winner.push(game.playerOne);
          game.winner.push(game.playerTwo);
          message = "Draw";
        } else if (playerOneCount > playerTwoCount) {
          // PlayerOne wins
          game.winner.push(game.playerOne);
          message = `Winner: ${game.playerOne}`;
        } else {
          // PlayerTwo wins
          game.winner.push(game.playerTwo);
          message = `Winner: ${game.playerTwo}`;
        }

        game.finished = true;
      }

      // 5) ========== Update the game in the database ======================
      const updatedGame = await RockPaperScissors.findOneAndUpdate(
        // turn, currentRound, finishedRounds, finished
        // populate and conceal the game before returning
        { _id: gameID },
        {
          $set: {
            currentRound: game.currentRound,
            turn: game.turn,
            winner: game.winner,
            finished: game.finished,
            finishedRounds: game.finishedRounds,
          },
        },
        { new: true }
      )
        .populate("playerOne", "_id username points")
        .populate("playerTwo", "_id username points")
        .populate("winner", "_id username points");

      // 6) ========== Conceal the populated game ======================
      const concealedGame = concealedRockPaperScissorsView(updatedGame, userID);
      res.setHeader("Cache-Control", "no-store, no-cache");
      res.status(200).json({
        token: token,
        game: concealedGame,
        message: message,
      });

      console.log(concealedGame);
    } catch (error) {
      console.error("Error submitting ship choice: ", error);
      res.status(500).json(error);
    }
  },
};

module.exports = RockPaperScissorsController;
