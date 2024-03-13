class AllGamesAPI {
  async newGame(token, endpoint) {
    try {
      const response = await fetch(`/${endpoint}`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const newGameData = await response.json();
      return newGameData;
    } catch (error) {
      console.error("GameAPI.newGame:", error);
      throw error;
    }
  }

  async fetchGame(token, endpoint, id) {
    try {
      const response = await fetch(`/${endpoint}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const gameData = await response.json();
      return gameData;
    } catch (error) {
      console.error("GameAPI.fetchGame:", error);
      throw error;
    }
  }

  async allGames(token, endpoint) {
    try {
      const response = await fetch(`/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const gameData = await response.json();
      return gameData;
    } catch (error) {
      console.error("GameAPI.allGames:", error);
      throw error;
    }
  }

  async joinGame(token, endpoint, id) {
    try {
      const response = await fetch(`/${endpoint}/${id}/join`, {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const gameData = await response.json();
      return gameData;
    } catch (error) {
      console.error("GameAPI.joinGame:", error);
      throw error;
    }
  }

  async forfeitGame(token, endpoint, id) {
    try {
      const response = await fetch(`/${endpoint}/${id}/forfeit`, {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const gameData = await response.json();
      return gameData;
    } catch (error) {
      console.error("GameAPI.forfeitGame:", error);
      throw error;
    }
  }

  async deleteGame(token, endpoint, id) {
    try {
      const response = await fetch(`/${endpoint}/${id}/delete`, {
        method: "delete",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const gameData = await response.json();
      return gameData;
    } catch (error) {
      console.error("GameAPI.forfeitGame:", error);
      throw error;
    }
  }
}

export default AllGamesAPI;
