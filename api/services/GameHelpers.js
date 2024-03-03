// ========= HELPER FUNCTION TO HANDLE ERRORS =============

// ========= HELPER FUNCTION TO POPULATE GAME =============
// TODO NOT USED YET, Not about to get working
const gamesListPopulate = async (GameModel) => {
  try {
    // Populate the game documents
    const populatedGames = await GameModel.find()
      .select({
        title: 1,
        endpoint: 1,
        playerOne: 1,
        playerTwo: 1,
        winner: 1,
        finished: 1,
      })
      .populate({
        path: "playerOne playerTwo winner",
        select: "_id username points",
      })
      .exec();

    return populatedGames;
  } catch (error) {
    // Handle any errors during population
    throw new Error("Error populating games: " + error.message);
  }
};

// Used, working
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
  gamesListPopulate,
  singleGamePopulate,
};
