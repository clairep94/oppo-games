import React, {useState, useRef, useEffect} from "react";
import UnderConstruction from '../UnderConstruction'
import BattleshipsAPI from '../../../api_calls/games/battleshipsAPI'
import io from "socket.io-client";
import GamePageButtons from "../../game_pages_refactored/GamePageButtonRow";
import BattleshipsSetUpGameboard from "./BattleshipsSetUpGameboard";
import BattleshipsAttackGameboard from "./BattleshipsAttackGameboard";


export default function Battleships({ 
  game, setGame, gameID, sessionUserID, socket, token, setToken,
  joinGame, deleteGame, forfeitGame, errorMessage, setErrorMessage, 
  winMessage, findWinMessage, loading, frostedGlass }) {

  // ============================= STATE VARIABLES ===========================================
  const battleshipsAPI = new BattleshipsAPI();

  const whoseTurn = (game.turn % 2 === 0) ? game.playerOne : game.playerTwo
  const attackStage = (game.playerOnePlacements.length !== 0 && game.playerTwoPlacements.length !== 0) // if NOT attack stage, don't show whose turn. show "Place your ships"

  useEffect(() => {
    findWinMessage(game)
  }, [game])


  // =========================== LAUNCHING A MISSILE ============================
  const launchMissile = async(row, col) => {
    console.log(`Coordinates: row:${row} col:${col}`)

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

    <div className={"flex flex-col bg-gray-500/40 w-full h-full items-center justify-between pt-[2rem] rounded-[2rem]" + frostedGlass}>
    {/* OPPONENT & TURN HEADER */}
    {attackStage ? (
        <p className="text-3xl font-bold">Whose turn: {" "}
          <span className="text-3xl font-bold">{whoseTurn?.username}</span>
        </p>
        ):( 
        <p className="text-3xl font-bold">Placing Ships</p>)}


    {/*  GAME BOARD -- diff gameboard for placing ships vs. ready */}
    {loading ? (
    <p>STILL LOADING</p>
    ):(<>
    {!attackStage ? (
      <>
      {/* PLACING SHIPS */}
      <BattleshipsSetUpGameboard game={game} sessionUserID={sessionUserID} setErrorMessage={setErrorMessage} setGame={setGame} token={token}
      setToken={setToken} battleshipsAPI={battleshipsAPI} gameID={gameID} socket={socket}/>
      </>
    ):(
      <>
      {/* ATTACKING BOARDS */}
        {/* PLAYER ONE BOARD */}
        {/* PLAYER TWO BOARD */}
      <BattleshipsAttackGameboard game={game} launchMissile={launchMissile}/>
      </>
    )}
    {JSON.stringify(game)}
    </>
    )}

  {/* BUTTON ROW */}
  <GamePageButtons game={game} sessionUserID={sessionUserID} joinGame={joinGame} forfeitGame={forfeitGame} deleteGame={deleteGame}/>

  {/* ERROR MESSAGE */}
  {errorMessage && 
      <h2 className="text-red-600/80 font-semibold text-xl p-3">{errorMessage}</h2>}

  <h2 className="text-white font-bold text-3xl p-3">
      {winMessage}
  </h2>



  </div>
  )
}
