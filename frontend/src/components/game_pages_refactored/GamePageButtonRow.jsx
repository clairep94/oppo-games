import React from 'react'

export default function GamePageButtons({game, joinGame, forfeitGame, deleteGame, sessionUserID, }) {
  return (
    <div className='flex flex-row'>
      
      {/* FORFEIT BUTTON-- only shows if sessionUser is a player && game is not over */}
      {!game.finished && game.playerTwo && (sessionUserID === game.playerOne._id || sessionUserID === game.playerTwo._id) &&
      (<button onClick={forfeitGame} className="bg-black/70 p-4 w-[13rem] rounded-lg">
          Forfeit
      </button>)
      }

      {/* DELETE BUTTON -- only shows if sessionUser is player One and player two has not joined */}
      {!game.playerTwo && (sessionUserID === game.playerOne._id) && 
      (<button onClick={deleteGame} className="bg-black/70 p-4 w-[13rem] rounded-lg">
        Delete
      </button>)
      }

      {/* JOIN BUTTON -- only shows if sessionUser is not player One and player two has not joined */}
      {!game.playerTwo && (sessionUserID !== game.playerOne._id) && 
      (<button onClick={joinGame} className="bg-black/70 p-4 w-[13rem] rounded-lg">
        Join
      </button>)
      }
    </div>

  )
}
