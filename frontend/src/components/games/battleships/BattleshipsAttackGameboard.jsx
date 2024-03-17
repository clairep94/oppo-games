import React, {useState, useRef, useEffect} from "react";
import BattleshipsAttackBoard from "./attack_stage_components/BattleshipsAttackBoard";


export default function BattleshipsAttackGameboard({ game, sessionUserID, setErrorMessage, setGame, token, setToken, socket }) {

  // ================ GAME DATA & VIEW ======================
  const [announcment, setAnnouncement] = useState("PLAYER HAS DONE XYZ");
  const TWUnitSize = 8;

  // ================ FUNCTION FOR SUBMITTING SHIP PLACEMENTS =========================

  const launchMissile = async(row, col) => {
    console.log(`Coordinates: row:${row} col:${col}`)

    if (token) {
      try {
        const response = await fetch(`/${game.endpoint}/${game._id}/launch_missile`, {
          method: 'put',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ row: row, col: col })
        })

        const gameData = await response.json();

        if (response === 200) {
          const gameID = gameData.game._id;
          const updatedGame = gameData.game;

          setGame(updatedGame);
          window.localStorage.setItem("token", gameData.token);
          setToken(window.localStorage.getItem("token"));

          const socketEventMessage =  `user ${sessionUserID} attacked row: ${row}, col: ${col}. Result: ${gameData.message}`
          socket.current.emit("send-game-update", {gameID, updatedGame, socketEventMessage})
        } else {
          console.log(`Error launching missile`, gameData.error)
          setErrorMessage(gameData.error)
        }
      } catch (error) {
        console.log(`Error launching missile`)
      }
    }

  }


  // ================= FUNCTION FOR SUBMITTING SHIP PLACEMENTS =============================

  // PLAYING VIEW --> If game.finished === true, show the ships
  return (
    <>
    {/* GAMEBOARDS */}
    <div className='flex flex-row bg-red-200/30 w-full h-full'>

      {/* PLAYER ONE BOARD */}
      <div className='flex flex-col w-full h-full'>
        {/* HEADER */}
        <h5 className="font-bold text-[2rem]">
          Player One: {game.playerOne.username}
        </h5>

        {/* BOARD */}
        <BattleshipsAttackBoard attackBoard={game.playerOneBoard} launchMissile={launchMissile} TWUnitSize={TWUnitSize}/>
      </div>


      {/* PLAYER TWO BOARD */}
      <div className='flex flex-col w-full h-full'>
        {/* HEADER */}
        <h5 className="font-bold text-[2rem]">
          Player Two: {game.playerTwo.username}
        </h5>

        {/* BOARD */}
        <BattleshipsAttackBoard attackBoard={game.playerTwoBoard} launchMissile={launchMissile} TWUnitSize={TWUnitSize}/>
      </div>


      {/* BOARD */}

    </div>

    {/* ANNOUNCEMENTS */}
    <div className="font-bold text-[1.5rem]">
      {announcment}
    </div>
    </>
  )
}
