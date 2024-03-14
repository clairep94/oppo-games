import React, {useState, useRef, useEffect} from "react";

export default function BattleshipsSetUpGameboard({game, placeShip, submitPlacements, loading}) {

  // takes in sessionUserID
  // If sessionUser is one of the players --> show board && show if other player is ready
  // If sessionUser is NOT an owner OR for other user's board --> show 

  const [shipDirectionHorizontal, setShipDirectionHorizontal] = useState(true);

  // =================================== JSX FOR UI ==============================================================
  return (
    <>
    {/* GAME BOARD */}
    <div className="flex flex-row bg-red-200/30 w-full h-full">
                            
    {/* PLAYER ONE SHIPS */}
    <div className="flex flex-col w-full h-full">
        <h5 className="font-bold text-[2rem]">
        {/* Player One: {game.playerOne._id === sessionUserID ? "You" : game.playerOne.username} */}
        Your Shipyard
        </h5>
        
        <div className={`flex flex-${shipDirectionHorizontal ? "col" : "row"} cursor-move`}>
            {Object.entries(game.playerOneShips).map(([ship, {units}]) => (
                <div key={ship}>                    
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
                        onClick={() => placeShip(row, col)}
                    ></div>
                    );
                })}
        </div>
        
        <p>
            {JSON.stringify(game.playerOneBoard)}
        </p>
    </div>
    

    </div>

    {/* SHIP PLACEMENTS BUTTONS */}
    <div className="flex flex-row space-x-2">
        {/* TOGGLE SHIPS BUTTON */}
        <button onClick={() => {setShipDirectionHorizontal(!shipDirectionHorizontal)}} className="bg-black/70 p-4 w-[13rem] rounded-lg">
            Toggle Ship Direction
        </button>
        {/* SUBMIT SHIP PLACEMENTS */}
        <button onClick={() => {console.log("Submit Ships")}} className="bg-black/70 p-4 w-[13rem] rounded-lg">
          Submit ships
        </button>
    </div>
  </>
  )
}
