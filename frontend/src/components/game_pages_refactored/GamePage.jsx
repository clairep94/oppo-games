import React, {useState, useRef, useEffect} from "react";
import { useParams } from "react-router";
import io from "socket.io-client";
import AllGamesAPI from "../../api_calls/allGamesAPI";
import { gamesMenu } from "../games/gamesMenu";
import GamePageHeader from "./GamePageHeader";
import UnderConstruction from "../games/UnderConstruction";
import ChatBox from "../messages/ChatBox";

// TODO Add socket functionality back into messages, games etc.

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
  const [errorMessage, setErrorMessage] = useState(null); // TODO move this to Game Component!!!
  const [announcement, setAnnouncement] = useState(null);
  const [winMessage, setWinMessage] = useState(null); // same as above but with game.winner.length

  // 404 error

  // --------- Message state variables ---------
  // Fetch happens inside the chatbox component
  // NOTE had to do this organisation because I can't separate socket listen events

  // ============================= GETTING THE PRESENTATION FOR THE PAGE FROM GAMETITLE PROP (non-async) ===========================
  // Get the presentation for the Game
  const gamePresentation = gamesMenu.find((gameType) => gameType.title === gameTitle);
  const GameComponent = gamePresentation.component;

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
      setLoading(false);
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
      const updatedGame = gameData.game
      setGame(updatedGame);
      const socketEventMessage = `user ${sessionUserID} joined game ${gameID}`

      socket.current.emit("send-game-update", { gameID, updatedGame, socketEventMessage })
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

      const updatedGame = gameData.game;
      setGame(updatedGame);
      findWinMessage(updatedGame);


      const socketEventMessage = `user ${sessionUserID} forfeited game ${gameID}`
      socket.current.emit("send-game-update", { gameID, updatedGame, socketEventMessage })
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
    // NOTE Cannot feed this into game component, need to keep here.
    socket.current.on("receive-game-update", ({ gameID, gameState }) => {
        console.log("received game from socket", gameState);
        setGame(gameState);
        setErrorMessage("");
    });

    //---------------- Receiving forfeit -------------------
    //---------------- Receiving join -------------------

    //---------------- Receiving messages ------------------
    // socket.current.on("receive-message", ({gameID, receivedMessage}) => {
    //   console.log("received message from socket", receivedMessage);
    //               // const newMessage = {
    //         //     _id: receivedMessage._id,
    //         //     gameID: receivedMessage.gameID,
    //         //     author: receivedMessage.author,
    //         //     body: receivedMessage.body
    //         // }
    //         // setMessages([...messages, receivedMessage])

    //         // setMessages((prevMessages) => prevMessages.concat(newMessage));
    //         // setMessages(currentMessages)

    // })

  }, [sessionUserID])

  // ============================== TAILWIND ==============================================
  const frostedGlass = ` bg-gradient-to-r from-gray-300/30 via-purple-100/20 to-purple-900/20 backdrop-blur-sm
  shadow-lg shadow-[#363b54] border-[3px] border-white/10 `
  const headerContainer = 'flex flex-row w-full h-[8rem] rounded-[1.5rem] p-10 pl-[5rem] justify-right'
  

  // =================================== JSX FOR UI ==============================================================
  // if (loading) {
  //   return <div>Loading...</div>;
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
          {loading ? (
            <p>LOADING...</p>
          ):(
            <GameComponent game={game} setGame={setGame} gameID={gameID}
            sessionUserID={sessionUserID} socket={socket} token={token} setToken={setToken}
            joinGame={joinGame} deleteGame={deleteGame} forfeitGame={forfeitGame} frostedGlass={frostedGlass}
            winMessage={winMessage} setWinMessage={setWinMessage} errorMessage={errorMessage} setErrorMessage={setErrorMessage}
            />
          )}
        </div>

        {/* MESSAGES CONTAINER */}
        <ChatBox sessionUserID={sessionUserID} gameID={gameID} token={token} socket={socket}/>
      </div>

    </div>
  );
  
}