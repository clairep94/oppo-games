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

    <div className={"flex flex-col bg-gray-500/40 w-[80rem] h-[40rem] items-center justify-between pt-[2rem] rounded-[2rem]" +  frostedGlass}>
      {/* OPPONENT & TURN HEADER */}
      {game.playerTwo ? ( 
        attackStage ? (
          <p className="text-3xl font-bold">Whose turn: {" "}
            <span className="text-3xl font-bold">{whoseTurn?.username}</span>
          </p>
          ):( 
          <p className="text-3xl font-bold">Placing Ships</p>)
        ):(<p className="text-3xl font-bold">Awaiting Player Two</p>)  }


      {/*  GAME BOARD -- diff gameboard for placing ships vs. ready */}
      {loading ? (
      <p>STILL LOADING</p>
      ):(<>
      {!attackStage ? (
        <>
        {/* PLACING SHIPS */}
          {/* BOARD */}
          {/* SHIPYARD */}
          {/* TOGGLE SHIPS BUTTON */}
        <BattleshipsSetUpGameboard game={game} placeShip={placeShip} submitPlacements={submitPlacements} loading={loading}/>
        {/* <UnderConstruction/> */}
        </>
      ):(
        <>
        {/* ATTACKING BOARDS */}
          {/* PLAYER ONE BOARD */}
          {/* PLAYER TWO BOARD */}
        <BattleshipsAttackGameboard game={game} launchMissile={launchMissile}/>
        </>
      )}
      </>
      )}

    {/* BUTTON ROW */}
    <GamePageButtons game={game} sessionUserID={sessionUserID} joinGame={joinGame} forfeitGame={forfeitGame} deleteGame={deleteGame}/>

    {/* ERROR MESSAGE */}
    {errorMessage && 
        <h2 className="text-red-600/80 font-semibold text-2xl p-3">{errorMessage}</h2>}

    <h2 className="text-white font-bold text-3xl p-3">
        {winMessage}
    </h2>



    </div>
  )
}
