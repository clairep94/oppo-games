import React, { useState } from 'react'
import GamePageButtons from '../game_pages_refactored/GamePageButtonRow';

export default function AwaitingPlayerTwo({game, sessionUserID, frostedGlass, joinGame, deleteGame, forfeitGame, errorMessage}) {

  const [copyButtonMessage, setCopyButtonMessage] = useState("Copy URL");

  const copyUrlToClipboard = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url);
    setCopyButtonMessage("Success!");
  }

  // =================================== JSX FOR UI ==============================================================
  return (
    <div className={"flex flex-col bg-gray-500/40 w-full h-[40rem] items-center justify-center p-[2rem] rounded-[2rem]" +  frostedGlass}>
      <h3 className='text-4xl font-bold py-2'>
        Awaiting Player Two
      </h3>
      {(game.playerOne._id === sessionUserID) &&
      <>
      <p className='text-xl pb-2'>
        Share this link to play with a friend
      </p>
      <button onClick={copyUrlToClipboard} className="bg-gray-600/80 hover:bg-gray-600/90 focus:outline-black border-gray-600/50 active:bg-gray-700/90 
      p-4 mb-2 w-[13rem] rounded-lg text-md font-medium">
        {copyButtonMessage}
      </button>
    </>    
    }
    <GamePageButtons game={game} sessionUserID={sessionUserID} joinGame={joinGame} deleteGame={deleteGame} forfeitGame={forfeitGame} />

    {/* ERROR MESSAGE */}
    {errorMessage && 
    <h2 className="text-red-600/80 font-semibold text-l p-3">{errorMessage}</h2>}

    </div>
  )
}
