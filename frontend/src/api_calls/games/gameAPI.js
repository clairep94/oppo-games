class GameAPI {
  constructor(endpoint, gameTitle) {
    this.endpoint = endpoint;
    this.gameTitle = gameTitle;
  }

  async newGame(token) {
    try {
      const response = await fetch(`/${this.endpoint}`, {
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

  async fetchGame(token, id) {
    try {
      const response = await fetch(`/${this.endpoint}/${id}`, {
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

  async allGames(token) {
    try {
      const response = await fetch(`/${this.endpoint}`, {
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

  async joinGame(token, id) {
    try {
      const response = await fetch(`/${this.endpoint}/${id}/join`, {
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

  async forfeitGame(token, id) {
    try {
      const response = await fetch(`/${this.endpoint}/${id}/forfeit`, {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const gameData = await response.json();
      return gameData;
    } catch (error) {
      console.error("BattleshipsAPI.forfeitGame:", error);
      throw error;
    }
  }
}

export default GameAPI;
