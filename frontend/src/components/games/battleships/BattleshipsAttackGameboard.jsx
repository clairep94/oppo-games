import React, {useState, useRef, useEffect} from "react";
import BattleshipsAttackBoard from "./attack_stage_components/BattleshipsAttackBoard";


export default function BattleshipsAttackGameboard({ game, sessionUserID, setErrorMessage, setGame, token, setToken, socket }) {

  // ================ GAME DATA & VIEW ======================
  const [announcment, setAnnouncement] = useState("");
  const TWUnitSize = 8;

  // ================ FUNCTION FOR SUBMITTING SHIP PLACEMENTS =========================
  const launchMissile = async(row, col, owner) => {
    if (owner){
      setErrorMessage("Cannot launch on own board!")
      return null;
    }
    console.log(`Coordinates: row:${row} col:${col}`)

    if (token) {
      console.log("has token")
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
        console.log(gameData)

        if (response.status === 200) {
          const gameID = gameData.game._id;
          const updatedGame = gameData.game;

          setGame(updatedGame);
          window.localStorage.setItem("token", gameData.token);
          setToken(window.localStorage.getItem("token"));

          const socketEventMessage =  `user ${sessionUserID} attacked row: ${row}, col: ${col}. Result: ${gameData.message}`
          socket.current.emit("send-game-update", {gameID, updatedGame, socketEventMessage})

          setErrorMessage("");
          findAnnouncement(gameData);
        } else {
          console.log(`Error launching missile`, gameData.error)
          setErrorMessage(gameData.error)
        }
      } catch (error) {
        console.log(`Error launching missile`)
      }
    }
  }

  // =============== FUNCTION FOR FINDING THE GAME ANNOUNCEMENT: ====================
  const findAnnouncement = (gameData) => {
    const actorID = gameData.actor
    const eventString = gameData.message
    const playerString = (actorID === sessionUserID) ? ("You") : (
      (actorID === gameData.game.playerOne._id) ? (gameData.game.playerOne.username) : (gameData.game.playerTwo.username)
    )
    const announcementString = `${playerString.toUpperCase()} ${eventString}!`
    setAnnouncement(announcementString)
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
          {(game.playerOne._id === sessionUserID) ? (
            <>Your Board</>
          ): (
            <>Player One: {game.playerOne.username}</>
          )
          }
        </h5>

        {/* BOARD */}
        <BattleshipsAttackBoard attackBoard={game.playerOneBoard} launchMissile={launchMissile} TWUnitSize={TWUnitSize} owner={(game.playerOne._id === sessionUserID)}/>
        {/* SHIPYARD */}
      </div>


      {/* PLAYER TWO BOARD */}
      <div className='flex flex-col w-full h-full'>
        {/* HEADER */}
        <h5 className="font-bold text-[2rem]">
        {(game.playerTwo._id === sessionUserID) ? (
            <>Your Board</>
          ): (
            <>Player Two: {game.playerTwo.username}</>
          )
          }
        </h5>

        {/* BOARD */}
        <BattleshipsAttackBoard attackBoard={game.playerTwoBoard} launchMissile={launchMissile} TWUnitSize={TWUnitSize} owner={(game.playerTwo._id === sessionUserID)}/>
        {/* SHIPYARD */}
      </div>

    </div>

    {/* ANNOUNCEMENTS */}
    <div className="font-bold text-[1.5rem]">
      {announcment}
    </div>
    </>
  )
}
