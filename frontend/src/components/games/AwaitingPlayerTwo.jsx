import React, { useState } from 'react'

export default function AwaitingPlayerTwo({game, sessionUserID, frostedGlass}) {

  const [copySuccess, setCopySuccess] = useState(false);

  const copyUrlToClipboard = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
  }

  // =================================== JSX FOR UI ==============================================================
  return (
    <div className={"flex flex-col bg-gray-500/40 w-full h-[40rem] items-center justify-center p-[2rem] rounded-[2rem]" +  frostedGlass}>
      <h3 className='text-4xl font-bold py-2'>
        Awaiting Player Two
      </h3>
      <p className='text-xl pb-2'>
        Share this link to play with a friend
      </p>
      <button onClick={copyUrlToClipboard} className="bg-gray-600/70 hover:bg-gray-600/90 focus:outline-black border-gray-600/50 active:bg-gray-700/80 
      p-4 mb-2 w-[13rem] rounded-lg text-md font-medium">
        Copy URL
      </button>
      {copySuccess && <p>URL copied!</p>}
    </div>
  )
}
