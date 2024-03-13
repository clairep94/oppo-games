import React, { useEffect } from 'react'

export default function TicTacToeGameboard({ game, setGame, socketCurrent, }) {

  const gameID = game._id
  // SESSION USER: FORFEIT, DELETE, JOIN

  // ============ SESSION USER GAMEPLAY =================================
  const rows = ["A", "B", "C"];

  const handlePlacePiece = async(row, col) => {
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
          setWhoseTurn((gameData.game.turn % 2 === 0) ? gameData.game.playerOne : gameData.game.playerTwo)
          findWinMessage(gameData.game)
          setErrorMessage("")

          socketCurrent.emit("place-piece", {gameID, updatedGame})
        })
      }
    }
  }
  // ============ SOCKET FOR OPPONENT MOVES & JOIN, FORFEIT, DELETE =================================
  useEffect(() => {
    //---------------- Receiving new move -------------------
    socket.current.on("receive-game-update", ({ gameID, gameState }) => {
      console.log("received game from socket", gameState);
      setGame(gameState);
      setWhoseTurn(
          gameState.turn % 2 === 0
          ? gameState.playerOne
          : gameState.playerTwo
      );
      findWinMessage(gameState);
      setErrorMessage("");
  });
  }, [sessionUserID])


  // =================================== JSX FOR UI ==============================================================
  return (
    <>
      {/* TTT CONTAINER */}
      <div className={"flex flex-col bg-gray-500/40 w-[40rem] h-[40rem] items-center justify-between py-[4rem] rounded-[2rem]" +  frostedGlass}>

        {/* OPPONENT & TURN HEADER */}
        {game.playerTwo ? (   
          <p className="text-3xl font-bold">Whose turn: {" "}
              <span className="text-3xl font-bold">{whoseTurn.username}</span>
          </p>
        ):( <p className="text-3xl font-bold">Awaiting player two</p>)}

        {/* TTT GAME BOARD */}
        <div className="tictactoe-board">
          {rows.map(row => (
            <div key={row} className="tictactoe-row flex">
              {Object.keys(game.gameBoard[row]).map(col => (
                <button
                  key={col}
                  className="h-[6rem] w-[6rem] mb-2 text-[2rem] bg-slate-400/40 border-2 border-white/20 shadow-sm text-black/80 rounded-md mr-1 hover:bg-slate-400 font-semibold flex items-center justify-center"
                  onClick={() => handlePlacePiece(row, col)}
                >
                  {game.gameBoard[row][col]}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* FORFEIT BUTTON-- only shows if sessionUser is a player && game is not over */}
        {!game.finished && game.playerTwo && (sessionUserID === game.playerOne._id || sessionUserID === game.playerTwo._id) &&
          (<button onClick={handleForfeit} className="bg-black/70 p-4 w-[13rem] rounded-lg">
              {forfeitButtonMessage}
          </button>)
        }
        
        {errorMessage && 
            <h2 className="text-red-600/80 font-semibold text-2xl p-3">{errorMessage}</h2>}

        <h2 className="text-white font-bold text-3xl p-3">
            {winMessage}
        </h2>
      </div>  
    </>
  );
}
