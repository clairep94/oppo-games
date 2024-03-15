import React, {useState, useRef, useEffect} from "react";
import UnderConstruction from '../UnderConstruction'
import TicTacToeAPI from '../../../api_calls/games/tictactoeAPI'
import io from "socket.io-client";
import TicTacToeGameboard from "./TicTacToeGameboard";
import GamePageButtons from "../../game_pages_refactored/GamePageButtonRow";


export default function TicTacToe({ game, setGame, gameID, sessionUserID, socket, token, setToken,
joinGame, deleteGame, forfeitGame, frostedGlass, errorMessage, setErrorMessage, winMessage, setWinMessage, findWinMessage,
}) {

  // ============================= STATE VARIABLES ===========================================
  const whoseTurn = (game.turn % 2 === 0) ? game.playerOne : game.playerTwo
  
  const ticTacToeAPI = new TicTacToeAPI();

  useEffect(() => {
    findWinMessage(game)
  }, [game])


  // =================================== PLACING A PIECE ==============================================================
  const placePiece = async(row, col) => {
    const coordinates = `${row}${col}`
    console.log(`Coordinates: ${row} ${col}`)

      if (token) {
        const movePayload = {row: row, col: col}
        ticTacToeAPI.placePiece(token, gameID, movePayload)
        .then(gameData => {
          window.localStorage.setItem("token", gameData.token);
          setToken(window.localStorage.getItem("token"));

          if (gameData.error){ // Backend handles errors and creates an error message
            setErrorMessage(gameData.error)

          } else {
            const updatedGame = gameData.game;
  
            setGame(gameData.game);
            findWinMessage(gameData.game)
            setErrorMessage("")
            const socketEventMessage = `user ${sessionUserID} played at ${row}${col}`
  
            socket.current.emit("send-game-update", {gameID, updatedGame, socketEventMessage})

          }
        })
      }
    // }
    
  }

  // =================================== JSX FOR UI ==============================================================
  return (
    <>
      {/* TTT CONTAINER */}
      <div className={"flex flex-col bg-gray-500/40 w-[40rem] h-[40rem] items-center justify-between py-[4rem] rounded-[2rem]" +  frostedGlass}>

        {/* OPPONENT & TURN HEADER */}
        {game.playerTwo ? (   
          <p className="text-3xl font-bold">Whose turn: {" "}
              <span className="text-3xl font-bold">{whoseTurn?.username}</span>
          </p>
        ):( <p className="text-3xl font-bold">Awaiting player two</p>)}

        {/* TTT GAME BOARD */}
        <TicTacToeGameboard gameBoard={game.gameBoard} handleButtonClick={placePiece} />

        {/* BUTTON ROW */}
        <GamePageButtons game={game} sessionUserID={sessionUserID} joinGame={joinGame} forfeitGame={forfeitGame} deleteGame={deleteGame}/>

        {/* ERROR MESSAGE */}
        {errorMessage && 
            <h2 className="text-red-600/80 font-semibold text-2xl p-3">{errorMessage}</h2>}

        <h2 className="text-white font-bold text-3xl p-3">
            {winMessage}
        </h2>
      </div>  
    </>
  )
}
