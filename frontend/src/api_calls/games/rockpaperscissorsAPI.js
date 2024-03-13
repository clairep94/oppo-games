import GameAPI from "./gameAPI";

class RockPaperScissorsAPI extends GameAPI {
  constructor() {
    super("/rockpaperscissors", "RockPaperScissors");
  }

  async placePiece(token, id, movePayload) {
    // Payload = {row: row, col: col}
    try {
      const response = await fetch(`${endpoint}/${id}/place_piece`, {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(movePayload),
      });
      const gameData = await response.json();
      return gameData;
    } catch (error) {
      console.error("TictactoeAPI.placePiece:", error);
      throw error;
    }
  }
}

export default RockPaperScissorsAPI;
