import React, {useState, useRef, useEffect} from "react";
import { useParams } from "react-router";
import io from "socket.io-client";
import AllGamesAPI from "../../api_calls/allGamesAPI";
import { gamesMenu } from "../games/gamesMenu";
import GamePageHeader from "./GamePageHeader";
import UnderConstruction from "../games/UnderConstruction";
import ChatBox from "../messages/ChatBox";

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
  const [errorMessage, setErrorMessage] = useState(null);
  const [announcement, setAnnouncement] = useState(null);
  // 404 error

  // ============================= GETTING THE PRESENTATION FOR THE PAGE FROM GAMETITLE PROP (non-async) ===========================
  // Get the presentation for the Game
  const gamePresentation = gamesMenu.find((gameType) => gameType.title === gameTitle);

  const GameComponent = gamePresentation.component;
  // const [whoseTurn, setWhoseTurn] = useState(null); // this needs to be stored and updated explicitly due to issues with game.turn
  const [winMessage, setWinMessage] = useState(null); // same as above but with game.winner.length


  // Find win message -> move to the game itself
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


  // ============================= LOADING THE GAME & GAME STATE VARIABLES (async) ===========================
  // Fetch Game Data
  const fetchGame = async () => {

    try {
      const gameData = await gameServer.fetchGame(token, gamePresentation.endpoint, gameID);
      window.localStorage.setItem("token", gameData.token);
      setToken(window.localStorage.getItem("token"));

      setGame(gameData.game);
      // opponent message
      // socket
    } catch (error) {
      setErrorMessage(error.message);
    }

  }
  
  useEffect(() => {
    if (token) {
      fetchGame()
    }
  }, [])
  
  // ============================= FUNCTIONS FOR ALL GAME TYPES ===========================
  const socket = useRef()
  const [onlineUsers, setOnlineUsers] = useState(null);

  // Join
  const joinGame = async (event) => {
    event.preventDefault();

    try {
      const gameData = await gameServer.joinGame(token, gamePresentation.endpoint, gameID);
      window.localStorage.setItem("token", gameData.token);
      setToken(window.localStorage.getItem("token"));

      setGame(gameData.game);
      // opponent message
      // socket
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // Forfeit
  const forfeitGame = async (event) => {
    event.preventDefault();

    try {
      const gameData = await gameServer.forfeitGame(token, gamePresentation.endpoint, gameID);
      window.localStorage.setItem("token", gameData.token);
      setToken(window.localStorage.getItem("token"));

      setGame(gameData.game);
      // win message
      // socket
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // Delete
  const deleteGame = async (event) => {
    event.preventDefault();
    
    try {
      const gameData = await gameServer.deleteGame(token, gamePresentation.endpoint, gameID);
      window.localStorage.setItem("token", gameData.token);
      setToken(window.localStorage.getItem("token"));

      navigate('/');
    
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  // ============================= SOCKET FOR RECEIVING UPDATES ===========================
  useEffect(()=> {
    socket.current = io('http://localhost:8800'); // this is the socket port
    socket.current.emit("add-new-user", sessionUserID, gameID); // send the sessionUserID to the socket server
    socket.current.emit("create-game-room", gameID);
    socket.current.on('get-users', (users)=>{
        setOnlineUsers(users)}) // get the onlineUsers, which should now include the sessionUserID
    
    //---------------- Receiving new move -------------------
    // socket.current.on("receive-game-update", ({ gameID, gameState }) => {
    //     console.log("received game from socket", gameState);
    //     setGame(gameState);
    //     setWhoseTurn(
    //         gameState.turn % 2 === 0
    //         ? gameState.playerOne
    //         : gameState.playerTwo
    //     );
    //     findWinMessage(gameState);
    //     setErrorMessage("");
    // });

    //---------------- Receiving forfeit -------------------
    socket.current.on("receive-forfeit-game", ({ gameID, gameState }) => {
        console.log("received forfeit game from socket", gameState);
        setGame(gameState);
        // setWhoseTurn(
        //     gameState.turn % 2 === 0
        //     ? gameState.playerOne
        //     : gameState.playerTwo
        // );
        setWinMessage(gameState); // setting a "opponent forfeited, you win" message makes both windows have this message.
        setErrorMessage("");
    });

    //---------------- Receiving join -------------------
    socket.current.on("receive-join-game", ({ gameID, gameState }) => {
      console.log("received joined game from socket", gameState);
      setGame(gameState);
      setErrorMessage("");
    })

  }, [sessionUserID])

  // ============================== TAILWIND ==============================================
  const frostedGlass = ` bg-gradient-to-r from-gray-300/30 via-purple-100/20 to-purple-900/20 backdrop-blur-sm
  shadow-lg shadow-[#363b54] border-[3px] border-white/10 `
  const headerContainer = 'flex flex-row w-full h-[8rem] rounded-[1.5rem] p-10 pl-[5rem] justify-right'
  

  // =================================== JSX FOR UI ==============================================================
  // if (loading) {
  //   return <div>Loading...</div>;
  // }

  // if (errorMessage) {
  //   return <div>Error: {errorMessage}</div>;
  // }

  return (
    <div
      className=" flex flex-row items-center justify-center pl-[10rem] pr-[2rem] py-[1rem]"
      style={{ backgroundImage: `url(/backgrounds/${gamePresentation.bgImageSource})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '100vh' }}
    >

      {/* PAGE CONTAINER */}
      <div className='flex flex-col w-full h-full justify-between space-y-5'>
        
        {/* HEADER */}
        <GamePageHeader
          frostedGlass={frostedGlass}
          sessionUserID={sessionUserID}
          gamePresentation={gamePresentation}
          game={game}
        />

        {/* GAMES CONTAINER -- this is the max size of the game, actual game board is inside */}
        <div className="flex flex-col items-center justify-center  h-full w-full">
          <GameComponent game={game} setGame={setGame}/>
          {game?._id}
          {/* <UnderConstruction/> */}
        </div>

        {/* MESSAGES CONTAINER */}
        <ChatBox sessionUserID={sessionUserID} gameID={gameID} token={token}/>
      </div>

    </div>
  );
  
}