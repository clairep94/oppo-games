import React, {useState, useRef, useEffect} from "react";
import { useParams } from "react-router";
import io from "socket.io-client";
import AllGamesAPI from "../../api_calls/allGamesAPI";
import { gamesMenu } from "../games/gamesMenu";
// Import all 3 game types and their boards
// Import Messages component

export default function GamePage({
  sessionUser,
  sessionUserID,
  navigate,
  token,
  setToken,
  gameTitle
  }) {

  // ============================= STATE VARIABLES ===========================================
  // --------- Session & Game ID ----------
  const { id } = useParams(); // IMPORTANT: DO NOT RENAME 'id' This refers to gameID but changing it would cause issues in routes etc.
  const gameID = id; // declared gameID variable to store this info in case it is more readable for usage below:

  // --------- Game state variables & Announcements ---------
  const gameServer = new AllGamesAPI();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState(null);
  // Is loading
  // 404 error
  // error messages

  // ============================= GETTING THE PRESENTATION FOR THE PAGE FROM GAMETITLE PROP (non-async) ===========================
  // Get the presentation for the Game
  const gamePresentation = gamesMenu.find((gameType) => gameType.title === gameTitle);
  // Find opponent message
  // Find win message -> move to the game itself

  // ============================= LOADING THE GAME & GAME STATE VARIABLES (async) ===========================
  // Fetch Game Data
  const fetchGame = async () => {
    try {
      const gameData = await gameServer.fetchGame(token, gameID)
      window.localStorage.setItem("token", gameData.token);
      setToken(window.localStorage.getItem("token"));
      setGame(gameData.game);
      setLoading(false);
      
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  }
  
  useEffect(() => {
    if (token) {
      fetchGame()
    }
  }, [])
  
  // ============================= FUNCTIONS FOR ALL GAME TYPES ===========================
  
  // Join
  const joinGame = async (event) => {
    event.preventDefault();

    try {
      const gameData = await gameServer.joinGame(token, endpoint, gameID);
      window.localStorage.setItem("token", gameData.token);
      setToken(window.localStorage.getItem("token"));

      setGame(gameData.game);
      // opponent message
      // socket
    } catch (error) {
      setError(error.message);
    }
  }

  // Forfeit
  const forfeitGame = async (event) => {
    event.preventDefault();

    try {
      const gameData = await gameServer.forfeitGame(token, endpoint, gameID);
      window.localStorage.setItem("token", gameData.token);
      setToken(window.localStorage.getItem("token"));

      setGame(gameData.game);
      // win message
      // socket
    } catch (error) {
      setError(error.message);
    }
  }

  // Delete
  const deleteGame = async (event) => {
    event.preventDefault();
    
    try {
      const gameData = await gameServer.deleteGame(token, endpoint, gameID);
      window.localStorage.setItem("token", gameData.token);
      setToken(window.localStorage.getItem("token"));

      navigate('/');
    
    } catch (error) {
      setError(error.message)
    }
  }


  // ============================== TAILWIND ==============================================
  const frostedGlass = ` bg-gradient-to-r from-gray-300/30 via-purple-100/20 to-purple-900/20 backdrop-blur-sm
  shadow-lg shadow-[#363b54] border-[3px] border-white/10 `
  const headerContainer = 'flex flex-row w-full h-[8rem] rounded-[1.5rem] p-10 pl-[5rem] justify-right'
  

  // =========== JSX FOR UI =====================
  if (loading) {
      return <div>Loading...</div>;
    }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Tic Tac Toe Game</h1>
      <p>Game ID: {gameData.id}</p>
      {/* Display other game data as needed */}
    </div>
  );
  
}