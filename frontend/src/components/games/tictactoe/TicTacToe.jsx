import React, {useState, useRef, useEffect} from "react";
import UnderConstruction from '../UnderConstruction'
import TicTacToeAPI from '../../../api_calls/games/tictactoeAPI'
import io from "socket.io-client";
import TicTacToeGameboard from "./TicTacToeGameboard";
import GamePageButtons from "../../game_pages_refactored/GamePageButtonRow";


export default function TicTacToe({ game, setGame, gameID, sessionUserID, socket, token, setToken,
joinGame, deleteGame, forfeitGame, frostedGlass
}) {

  // ============================= STATE VARIABLES ===========================================
  const [errorMessage, setErrorMessage] = useState(null);
  const [winMessage, setWinMessage] = useState(null); // same as above but with game.winner.length
  const whoseTurn = (game.turn % 2 === 0) ? game.playerOne : game.playerTwo
  
  const ticTacToeAPI = new TicTacToeAPI();

  const findWinMessage = (game) => {
    if (game.winner.length === 0) {
        setWinMessage('');
    } else if (game.winner.length === 2) {
        setWinMessage("It's a draw!");
    } else {
        if (game.winner[0]._id === sessionUserID) {
            setWinMessage("You win!")
        } else {
            setWinMessage(`${game.winner[0].username} wins!`)
        }
    }
  };

  useEffect(() => {
    findWinMessage(game)
  }, [])


  // =================================== JSX FOR UI ==============================================================
  const placePiece = async(row, col) => {
    const coordinates = `${row}${col}`
    console.log(`Coordinates: ${row} ${col}`)

    // check if there is a second player:
    if (!game.playerTwo) {
      console.log("Must wait for player two!")
      setErrorMessage("You must wait for player two to join")

    // check if the space is already occupied:
    } else if (game.xPlacements.includes(coordinates) || game.oPlacements.includes(coordinates)){
      console.log("already a piece here")
      setErrorMessage("There is already a piece here!")
      
    // check if game is already over:
    } else if (game.finished) {
      setErrorMessage("The game is already over!")

    // check if the sessionUserID === whoseTurn._id -> if not, setErrorMessage
    } else if (sessionUserID !== whoseTurn._id) {
      if (sessionUserID === game.playerOne._id || sessionUserID === game.playerTwo._id){
        setErrorMessage("It's not your turn!")
      } else {
        setErrorMessage("You're not in this game!")
      }
      
    // if all checks pass, place the piece and update game with returned game data
    } else {
      if (token) {
        const movePayload = {row: row, col: col}
        ticTacToeAPI.placePiece(token, gameID, movePayload)
        .then(gameData => {
          window.localStorage.setItem("token", gameData.token);
          setToken(window.localStorage.getItem("token"));

          const updatedGame = gameData.game;

          setGame(gameData.game);
          findWinMessage(gameData.game)
          setErrorMessage("")
          const socketEventMessage = `user ${sessionUserID} played at ${row}${col}`

          socket.current.emit("send-game-update", {gameID, updatedGame, socketEventMessage})
        })
      }
    }
    
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
