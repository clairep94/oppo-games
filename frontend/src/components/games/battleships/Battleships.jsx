import React, {useState, useRef, useEffect} from "react";
import UnderConstruction from '../UnderConstruction'
import BattleshipsAPI from '../../../api_calls/games/battleshipsAPI'
import io from "socket.io-client";
import GamePageButtons from "../../game_pages_refactored/GamePageButtonRow";
import BattleshipsSetUpGameboard from "./BattleshipsSetUpGameboard";
import BattleshipsAttackGameboard from "./BattleshipsAttackGameboard";


export default function Battleships({ game, setGame, gameID, sessionUserID, socket, token, setToken,
  joinGame, deleteGame, forfeitGame, frostedGlass, errorMessage, setErrorMessage, winMessage, setWinMessage, findWinMessage, loading }) {

  // ============================= STATE VARIABLES ===========================================
  const battleshipsAPI = new BattleshipsAPI();

  const whoseTurn = (game.turn % 2 === 0) ? game.playerOne : game.playerTwo
  const attackStage = (game.playerOnePlacements && game.playerTwoPlacements) // if NOT attack stage, don't show whose turn. show "Place your ships"
  // TODO figure out UI for game stages ^^
  useEffect(() => {
    findWinMessage(game)
  }, [game])




  // find the userPlayer string
  // find if the user had submitted ships --> userPlayerStr+Placements.length === 0

  // =========================== SUBMITTING SHIP PLACEMENTS ============================
  const placeShip = async(row, col) => { // function for frontend selection of placements
    console.log(`Clicked on row ${row} and column ${col}`);
  };

  const submitPlacements = async(event) => { // submitting the full gameboard to the backend
    // convert board buttons into an array
    event.preventDefault();
  }


  // =========================== LAUNCHING A MISSILE ============================
  const launchMissile = async(row, col) => {
    const coordinates = `${row}${col}`
    console.log(`Coordinates: ${row} ${col}`)

    if (token) {
      const missilePayload = {row: row, col: col}
      const gameData = battleshipsAPI.launchMissile(token, gameID, missilePayload)
      window.localStorage.setItem("token", gameData.token);
      setToken(window.localStorage.getItem("token"));

      if (gameData.error) {
        setErrorMessage(gameData.error)
      } else {
        const updateGame = gameData.game;

        setGame(updateGame);
        findWinMessage(updateGame);
        setErrorMessage("");
        const socketEventMessage = `user ${sessionUserID} launched at row: ${row}, col: ${col}`

        socket.current.emit("send-game-update", {gameID, updateGame, socketEventMessage})
      }
    }
  }




  // ============================== TAILWIND ==============================================
    const headerContainer = 'flex flex-row w-full h-[8rem] rounded-[1.5rem] p-10 pl-[5rem] justify-right'

  // =================================== JSX FOR UI ==============================================================
  
  return (

    <UnderConstruction/>
  )
}
