import React from 'react'

export default function GamePageHeader({ frostedGlass, sessionUserID, gamePresentation, game }) {
  const headerContainer = 'flex flex-row w-full h-[8rem] rounded-[1.5rem] p-10 pl-[5rem] justify-right'

  const findOpponentMessage = (game) => {
    if (!game.playerTwo) {
        if (game.playerOne._id === sessionUserID){
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

  // =================================== JSX FOR UI ==============================================================
  return (
    <div className={headerContainer + frostedGlass + 'justify-between items-center'}>
          {/* HEADER GREETING */}
          <div className='flex flex-col space-y-5'>
            <h3 className='text-5xl text-white font-extrabold'>
              {gamePresentation.title}{game && findOpponentMessage(game)}
            </h3>
          </div>
        </div>
  )
}
