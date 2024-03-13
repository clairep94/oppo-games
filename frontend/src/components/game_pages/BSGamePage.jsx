import React, {useState, useRef, useEffect} from "react";
import {useParams} from "react-router-dom";
import { newGame, fetchGame, allGames, placePiece, forfeitGame } from "../../api_calls/battleshipsAPI";
import { addMessage, fetchMessages } from "../../api_calls/messageAPI";
import io from "socket.io-client";
import InputEmoji from 'react-input-emoji';

import Draggable from 'react-draggable';

// TODO will refactor
// Hardcoding before refactoring BS into GamePage

export default function BSGamePage({ token, setToken, sessionUserID, sessionUser }) {

    const background = 'BS2.jpg'
    const mapName = 'River Map'
    const [shipDirectionHorizontal, setShipDirectionHorizontal] = useState(true);
    const handleClick = (row, col) => {
        console.log(`Clicked on row ${row} and column ${col}`);
      };

    const handleSubmit = () => {
        // convert board buttons into an array
        // if ship is snapped to board,
    }


    // ============================= STATE VARIABLES ===========================================
    // --------- Session & Game ID ----------
    const { id } = useParams(); // IMPORTANT: DO NOT RENAME 'id' This refers to gameID but changing it would cause issues in routes etc.
    const gameID = id; // declared gameID variable to store this info in case it is more readable for usage below:

    // ------- Game state variables & Finding win: ----------
    const [game, setGame] = useState(null); // stores game object retrieved from DB
    const [whoseTurn, setWhoseTurn] = useState(null); // this needs to be stored and updated explicitly due to issues with game.turn

    const [winMessage, setWinMessage] = useState(null); // same as above but with game.winner.length
    const [errorMessage, setErrorMessage] = useState(null);
    const [forfeitButtonMessage, setForfeitButtonMessage] = useState("Forfeit Game");


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

    const findOpponentMessage = (game) => {
        if (!game.playerTwo) {
            if (game.playerOne._id === game.playerOne._id){
                return ": You are awaiting Challenger"
            } else {
                return `: ${game.playerOne.username} is awaiting challenger`
            }

        } else if (sessionUserID === game.playerOne._id) {
            return `: You vs. ${game.playerTwo.username}`

        } else if (sessionUserID === game.playerTwo._id) {
            return `: You vs. ${game.playerOne.username}`

        } else {
            return `: ${game.playerOne.username} vs ${game.playerTwo.username}`
        } 
    }

    const findOpponent = (game) => { // return the opponent user document
        return (sessionUserID === game.playerOne._id ? game.playerTwo : game.playerOne)
    }

    // ===================== LOADING THE BOARD ====================================
    // Function to fetch the tictactoe data
    const fetchGameData = () => {
        fetchGame(token, gameID) //TODO fix? this version of fetchGameData always refreshes the token so the user never times out
            .then(gameData => {
                window.localStorage.setItem("token", gameData.token);
                setToken(window.localStorage.getItem("token"));

                // repeat these when player places a piece or when we receive new data from opponent
                setGame(gameData.game);
                setWhoseTurn((gameData.game.turn % 2 === 0) ? gameData.game.playerOne : gameData.game.playerTwo)
                findWinMessage(gameData.game)
            })
    }

    // Get the board from the DB once the component is loaded.
    useEffect(() => {
        if (token) {
            fetchGameData()
        }
    }, [])


    // ============================== TAILWIND ==============================================
    const frostedGlass = ` bg-gradient-to-r from-gray-300/30 via-purple-100/20 to-purple-900/20 backdrop-blur-sm
    shadow-lg shadow-[#363b54] border-[3px] border-white/10 `
    const headerContainer = 'flex flex-row w-full h-[8rem] rounded-[1.5rem] p-10 pl-[5rem] justify-right'

    // =================================== JSX FOR UI ==============================================================
    if(game){
        return (
        // BACKGROUND
        <div
            className=" flex flex-row items-center justify-center pl-[10rem] pr-[2rem] p-[1rem]"
            style={{ backgroundImage: `url(/backgrounds/${background})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '100vh' }}>
            {/* PAGE CONTAINER */}
            <div className='flex flex-col w-full h-full justify-between space-y-5'>
                {/* HEADER */}
                <div className={headerContainer + frostedGlass + 'justify-between items-center'}>
                    {/* HEADER GREETING */}
                    <div className='flex flex-col space-y-5'>
                        <h3 className='text-5xl text-white font-extrabold'>
                            {game.title}{game && findOpponentMessage(game)}
                        </h3>
                    </div>
                </div>
    
    
                {/* GAMES CONTAINER -- this is the max size of the game, actual game board is inside */}
                <div className="flex flex-col items-center justify-center  h-full w-full">

                    {/* BATTLESHIPS CONTAINER */}
                    <div className={"flex flex-col bg-gray-500/40 w-[80rem] h-[40rem] items-center justify-between pt-[2rem] rounded-[2rem]" +  frostedGlass}>
    
                        {/* OPPONENT & TURN HEADER */}
                        {/* {game.playerTwo ? (   
                                <p className="text-3xl font-bold">Whose turn: {" "}
                                    <span className="text-3xl font-bold">{whoseTurn.username}</span>
                                </p>
                        ):( <p className="text-3xl font-bold">Awaiting player two</p>)} */}
                        <p className="text-3xl font-bold">Place your ships</p>

                        {/*  GAME BOARD */}
                        <div className="flex flex-row bg-red-200/30 w-full h-full">
                            
                            {/* PLAYER ONE SHIPS */}
                            <div className="flex flex-col w-full h-full">
                                <h5 className="font-bold text-[2rem]">
                                {/* Player One: {game.playerOne._id === sessionUserID ? "You" : game.playerOne.username} */}
                                Your Shipyard
                                </h5>

                                <div className={`flex flex-${shipDirectionHorizontal ? "col" : "row"} cursor-move`}>
                                    {Object.entries(game.playerOneShips).map(([ship, {units}]) => (
                                        <Draggable>
                                        <div key={ship}>
                                            {/* <p>{ship}</p> */}
                                            {/* Render draggable squares */}
                                                <div className={`flex flex-${shipDirectionHorizontal ? "row" : "col"} m${shipDirectionHorizontal ? "y" : "x"}-1`}
                                                key={ship}
                                                >
                                                    {Array.from({ length: units }, (_, index) => (
                                                    <div
                                                        key={index}
                                                        className={`w-8 h-8 bg-red-400/70 mr-[0px]`}
                                                    ></div>
                                                    ))}
                                                </div>
                                        </div>
                                        </Draggable>
                                    ))}
                                </div>

                            </div>

                            {/* BOARD */}
                            <div className="flex flex-col w-full h-full bg-green-50/10">
                                <h5 className="font-bold text-[2rem]">
                                    Your Board
                                </h5>

                                <div className="grid grid-cols-10 gap-0 w-[20rem]">
                                    {/* Create the 10x10 grid */}
                                        {Array.from({ length: 10 * 10 }).map((_, index) => {
                                            const row = Math.floor(index / 10);
                                            const col = index % 10;

                                            return (
                                            <div
                                                key={index}
                                                className={`bg-gray-400/50 border border-black w-8 h-8`}
                                                onClick={() => handleClick(row, col)}
                                            ></div>
                                            );
                                        })}
                                </div>
                                
                                <p>
                                    {JSON.stringify(game.playerOneBoard)}
                                </p>
                            </div>
                            

                        </div>
                        

                        <div className="flex flex-row space-x-2">
                            
                            {/* TOGGLE SHIPS BUTTON */}
                            <button onClick={() => {setShipDirectionHorizontal(!shipDirectionHorizontal)}} className="bg-black/70 p-4 w-[13rem] rounded-lg">
                                Toggle Ship Direction
                            </button>

                            {/* SUBMIT SHIP PLACEMENTS */}
                            <button onClick={() => {console.log("Submit Ships")}} className="bg-black/70 p-4 w-[13rem] rounded-lg">
                                Submit ships
                            </button>
                            {/* FORFEIT BUTTON-- only shows if sessionUser is a player && game is not over */}
                            {!game.finished && game.playerTwo && (sessionUserID === game.playerOne._id || sessionUserID === game.playerTwo._id) &&
                                (<button onClick={()=>{console.log("Forfeit")}} className="bg-black/70 p-4 w-[13rem] rounded-lg">
                                    {forfeitButtonMessage}
                                </button>)
                            }

                        </div>

                        
                        {errorMessage && 
                            <h2 className="text-red-600/80 font-semibold text-2xl p-3">{errorMessage}</h2>}

                        <h2 className="text-white font-bold text-3xl p-3">
                            {winMessage}
                        </h2>

                    </div>
                </div>
    
    
                {/* MESSAGES container */}
                <div className='flex flex-col h-[22%]'>
                    <h3 className='text-3xl text-white font-extrabold ml-5 -translate-y-2'>
                        Messages
                    </h3>
                    {/* MESSAGES BOX */}
                    <div className="flex flex-col bg-gray-600/40 rounded-[1rem] h-full overflow-y-auto px-4 py-2 border-2 space-y-1 border-white/20">
                        {/* MESSAGES */}
                        <div className="flex flex-col h-full overflow-auto px-1 ">
                            
                                    <p className="text-white/80">Write a message...</p>
                           
                            {/* Empty div to scroll to the last message */}
                    
                        </div>
                        <div className="flex flex-col h-2/5">
                        {/* Input Field from React Lib for writing a new message, can add emojis */}
                            <InputEmoji 
                                // value={newMessage? newMessage : ""}
                                // cleanOnEnter
                                // onChange={handleChange}
                                // onEnter={handleSend}
                                placeholder='Type a message...'
                            />
                        </div>
                    </div>
                </div>


            </div>        
        </div>        
    
        )
    }
}



// =========== SUPPORTIVE COMPONENTS: ==================================== //
