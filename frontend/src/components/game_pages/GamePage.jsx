import React, {useState, useRef, useEffect} from "react";
import {useParams} from "react-router-dom";
// import { newGame, fetchGame, allGames, placePiece, forfeitGame } from "../../api_calls/tictactoeAPI";
import io from "socket.io-client";

export default function GamePage({sessionUser, navigate, gameTitle, token, setToken, sessionUserID}) {

    const getGamePresentation = (gameTitle) => {
        let gameDict
        if (gameTitle === "Tic-Tac-Toe") {
            gameDict = {
                title: gameTitle,
                // opponentUsername: ((game.playerTwo._id === sessionUser._id ? game.playerOne.username : game.playerTwo.username)),
                background: 'TTT.jpg',
                mapName: 'Icy Alpine',
                // component: <TicTacToe game={game}/>            
            }
        } else if (gameTitle === "Battleships") {
            gameDict = {
                title: gameTitle,
                // opponentUsername: ((game.playerTwo._id === sessionUser._id ? game.playerOne.username : game.playerTwo.username)),
                background: 'BS2.jpg',
                mapName: 'River Map',
                // component: <Battleships game={game}/>            
            }
        } else {
            gameDict = {
                title: gameTitle,
                // opponentUsername: ((game.playerTwo._id === sessionUser._id ? game.playerOne.username : game.playerTwo.username)),
                background: 'RPS.jpg',
                mapName: 'River Map',
                // component: <Battleships game={game}/>            
            }
        }
        return gameDict
    }

    const gameDict = getGamePresentation(gameTitle)

    // =========== TAILWIND ==============
    const frostedGlass = ` bg-gradient-to-r from-gray-300/30 via-purple-100/20 to-purple-900/20 backdrop-blur-sm
    shadow-lg shadow-[#363b54] border-[3px] border-white/10 `
    const headerContainer = 'flex flex-row w-full h-[8rem] rounded-[1.5rem] p-10 pl-[5rem] justify-right'

    

    // =========== JSX FOR UI =====================
    return (
    // BACKGROUND
    <div
        className=" flex flex-row items-center justify-center pl-[10rem] pr-[2rem] py-[1rem]"
        style={{ backgroundImage: `url(/backgrounds/${gameDict.background})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '100vh' }}>
        {/* PAGE CONTAINER */}
        <div className='flex flex-col w-full h-full justify-between space-y-5'>
            {/* HEADER */}
            <div className={headerContainer + frostedGlass + 'justify-between items-center'}>
                {/* HEADER GREETING */}
                <div className='flex flex-col space-y-5'>
                    <h3 className='text-5xl text-white font-extrabold'>
                        {gameDict.mapName}: {gameDict.title} vs. YOUR OPPONENT
                    </h3>
                </div>
            </div>


            {/* GAMES CONTAINER -- this is the max size of the game, actual game board is inside */}
            <div className="flex flex-col items-center justify-center  h-full w-full">
                <div className="flex flex-col bg-red-200/60 w-[40rem] h-[40rem]">
                    EXAMPLE GAME BOARD
                </div>
            </div>


            {/* MESSAGES container */}
            <div className='flex flex-col h-[22%]'>
                <h3 className='text-3xl text-white font-extrabold ml-3'>
                    Messages
                </h3>
                <div className="flex flex-col bg-gray-600/40 rounded-[1rem] h-full overflow-y-auto px-5 py-2 border-2 space-y-1 border-white/20">
                    <div className="flex flex-col h-full overflow-auto">
                        MESSAGES
                    </div>
                    <div className="flex flex-col h-2/5 bg-white/10 rounded-lg border-2 border-white/20 p-2">
                        Write a message... 
                    </div>
                </div>
            </div>



        </div>        
    </div>        

    )
}

