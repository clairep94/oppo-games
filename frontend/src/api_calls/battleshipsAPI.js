const endpoint = "/battleships";

const newGame = async (token) => {
  try {
    const response = await fetch(`${endpoint}`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const newGameData = await response.json();
    return newGameData;
  } catch (error) {
    console.error("BattleshipsAPI.newGame:", error);
    throw error;
  }
};

const fetchGame = async (token, id) => {
  try {
    const response = await fetch(`${endpoint}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const gameData = await response.json();
    return gameData;
  } catch (error) {
    console.error("BattleshipsAPI.findUser:", error);
    throw error;
  }
};

const allGames = async (token) => {
  try {
    const response = await fetch(`${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const gameData = await response.json();
    console.log(gameData);
    return gameData;
  } catch (error) {
    console.error("BattleshipsAPI.allUsers:", error);
    throw error;
  }
};

const placePiece = async (token, id, movePayload) => {
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
    console.error("BattleshipsAPI.placePiece:", error);
    throw error;
  }
};

const joinGame = async (token, id) => {
  // Payload = {row: row, col: col}
  try {
    const response = await fetch(`${endpoint}/${id}/join`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const gameData = await response.json();
    return gameData;
  } catch (error) {
    console.error("BattleshipsAPI.join:", error);
    throw error;
  }
};

const forfeitGame = async (token, id) => {
  try {
    const response = await fetch(`${endpoint}/${id}/forfeit`, {
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
};

export { newGame, fetchGame, allGames, placePiece, joinGame, forfeitGame };
