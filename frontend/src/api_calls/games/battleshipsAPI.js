import GameAPI from "./gameAPI";

class BattleshipsAPI extends GameAPI {
  constructor() {
    super("/battleships", "Battleships");
  }

  async submitShipPlacements(token, id, placementsPayload) {
    // Payload = nested array of chars, 10x10 matrix
    try {
      const response = await fetch(`${endpoint}/${id}/submit_placements`, {
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
      console.error("BattleshipsAPI.submitPlacements:", error);
      throw error;
    }
  }

  async launchMissile(token, id, missilePayload) {
    // Payload = {row: ___, col: ____}
    try {
      const response = await fetch(`${endpoint}/${id}/launch_missile`, {
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
      console.error("BattleshipsAPI.launchMissile:", error);
      throw error;
    }
  }
}

export default BattleshipsAPI;
