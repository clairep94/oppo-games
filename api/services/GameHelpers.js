// ========= HELPER FUNCTION TO HANDLE ERRORS =============

const { query } = require("express");

// Helper function to handle "Game not found" error
const handleGameNotFound = (res, token, game) => {
  if (!game) {
    return res.status(404).json({ error: "Game not found", token: token });
  }
};

// Helper function to handle other standard game errors, depending on if the game needs to be full or not
// TODO not used yet, need to figure out how to handle the specific error messages
const handleGameErrors = (
  res,
  token,
  game, // Game is NOT populated.
  sessionUser,
  withPlayerTwo = true
) => {
  if (!game) {
    return res.status(404).json({ error: "Game not found", token: token });
  }
  if (withPlayerTwo) {
    // games that require playerTwo
    // Game already finished error
    if (game.finished) {
      console.log("ERROR: GAME ALREADY FINISHED");
      return res.status(403).json({
        error: "Game already finished.",
        token: token,
      });
    }

    // Awaiting player two error
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
  } else {
    // games that need to be awaiting player two
    // Already joined game error
    if (
      sessionUser == game.playerOne ||
      (game.playerTwo && game.playerTwo == sessionUser)
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
    }
  }
};

// ========= HELPER FUNCTION TO POPULATE GAME =============

const gamesListPopulate = async (games) => {
  try {
    // Populate the game documents
    const populatedGame = await game
      .populate({
        path: "playerOne playerTwo winner",
        select: "_id username points",
      })
      .execPopulate();

    return populatedGame;
  } catch (error) {
    // Handle any errors during population
    throw new Error("Error populating game: " + error.message);
  }
  // query
  //   .select({
  //     title: 1,
  //     endpoint: 1,
  //     playerOne: 1,
  //     playerTwo: 1,
  //     winner: 1,
  //     finished: 1,
  //   })
  //   .populate("playerOne", "_id username points")
  //   .populate("playerTwo", "_id username points")
  //   .populate("winner", "_id username points")
  //   .exec(callback);
};

const singleGamePopulate = async (game) => {
  try {
    // Populate the game document
    const populatedGame = await game
      .populate({
        path: "playerOne playerTwo winner",
        select: "_id username points",
      })
      .execPopulate();

    return populatedGame;
  } catch (error) {
    // Handle any errors during population
    throw new Error("Error populating game: " + error.message);
  }
};

module.exports = {
  handleGameNotFound,
  handleGameErrors,
  gamesListPopulate,
  singleGamePopulate,
};
