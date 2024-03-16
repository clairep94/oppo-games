import React, {useState, useRef, useEffect} from "react";
import BattleshipsSetUpShipyard from "./BattleshipsSetUpShipyard";

export default function BattleshipsSetUpGameboard({game, submitPlacements, sessionUserID}) {

    // ================ GAME DATA & VIEW ======================
    // Is the sessionUser an observer
    const isObserver = (sessionUserID !== game.playerOne._id && sessionUserID !== game.playerTwo._id)

    // Find the sessionUser's ship submission
    const sessionUserPlayerStr = sessionUserID === game.playerOne._id ? "playerOne" : "playerTwo";
    const sessionUserPlacementsVar = sessionUserPlayerStr + "Placements"; 
    const sessionUserPlacements = game[sessionUserPlacementsVar]; // [] or nested array

    // Check if the sessionUser has already submitted placements:
    const alreadySubmitted = sessionUserPlacements === 0;
    // const alreadySubmitted = sessionUserBoard === emptyBoard;

    // Find the opponent's ship submission
    const opponentPlayerStr = sessionUserID === game.playerOne._id ? "playerTwo" : "playerOne";
    const opponentPlacementsVar = opponentPlayerStr + "Placements";
    const opponentPlacements = game[opponentPlacementsVar]; // [] or "submitted"

    // Check if the opponent has already submitted placements:
    const opponentSubmitted = opponentPlacements === "submitted"

    // ================= STATE VARIABLES =============================
    const emptyBoard =  Array.from({ length: 10 }, () =>
        Array.from({ length: 10 }, () => "")) // USE THIS TO RESET THE BOARD

    const resetShipYard = [
        {title: "carrier", placed: false, units: 5, code: "C" }, // 5 units
        {title: "battleship", placed: false, units: 4, code: "B" }, // 4 units
        {title: "cruiser", placed: false, units: 3, code: "R" }, // 3 units
        {title: "submarine", placed: false, units: 3, code: "U" }, // 3 units
        {title: "destroyer", placed: false, units: 2, code: "D" }, // 2 units
    ]
    
    // PLACING THE SHIPS
    const [placementBoard, setPlacementBoard] = useState(emptyBoard); // STORES THE WORKING STATE OF THE PLACEMENT BOARD
    const [placementShipyard, setPlacementShipyard] = useState(resetShipYard); // STORES THE WORKING STATE OF THE SHIPYARD

    const [shipDirectionHorizontal, setShipDirectionHorizontal] = useState(true);
    const [currentShip, setCurrentShip] = useState(null);



    // SELECTING A SHIP
    const selectShip = (shipType) => {
        if (shipType === currentShip) {
            setCurrentShip(null);
        } else {
            setCurrentShip(shipType)
            console.log(`Selecting ${shipDirectionHorizontal ? "Horizontal" : "Vertical"} Ship: `, currentShip)
        }
    }

    // PLACING A SHIP
    const placeShip = (row, col, element) => {
        console.log(`Unit: row: ${row}, column: ${col}, element: ${element}\n ${shipDirectionHorizontal ? "Horizontal" : "Vertical"}`, currentShip)

    }



    // RESETTING THE SHIP PLACEMENTS
    const resetShipPlacements = () => {
        console.log("Resetting ship placements")
        setCurrentShip(null);
    }

    // SUBMITTING THE SHIP PLACEMENTS

  // =================================== JSX FOR UI ==============================================================

  // OBSERVER
  if (isObserver) {
    return (
        <>
            {/* SHIP PLACEMENTS BOARD */}
            <div className="flex flex-row bg-red-200/30 w-full h-full">
                Players are placing their pieces
            </div>
        </>
    )
  } 

  // ALREADY SUBMITTED SHIPS:
  if (alreadySubmitted) {
    return(
        <>
            {/* SHIP PLACEMENTS BOARD */}
            <div className="flex flex-row bg-red-200/30 w-full h-full">
                Already submitted ships. Please await opponent to submit their ships
            </div>
        </>
    )
  }

  // SESSIONUSER IS ONE OF THE PLAYERS
  return (
    <>
    {/* SHIP PLACEMENTS BOARD */}
    <div className="flex flex-row bg-red-200/30 w-full h-full">
                            
        {/* SHIPYARD */}
        <div className="flex flex-col w-full h-full">
            {/* SHIPYARD HEADER */}
            <h5 className="font-bold text-[2rem]">
            Your Shipyard
            </h5>
            <BattleshipsSetUpShipyard placementShipyard={placementShipyard} shipDirectionHorizontal={shipDirectionHorizontal} selectShip={selectShip}/>

        </div>

        {/* BOARD */}
        <div className="flex flex-col w-full h-full bg-green-50/10">
            <h5 className="font-bold text-[2rem]">
                Your Board
            </h5>

            <div className="grid grid-cols-10 gap-0 w-[20rem]">
                    {/* Create the 10x10 grid */}
                        {placementBoard.map((row, rowIndex) => (
                            row.map((element, colIndex) => (
                                <div
                                    key={`${rowIndex}-${colIndex}`}
                                    className={`bg-gray-400/50 border border-black w-8 h-8`}
                                    onClick={() => placeShip(rowIndex, colIndex, element)}
                                >{element}</div>
                            ))
                            )
                        )}

            </div>
            
            <p>
                {JSON.stringify(placementBoard)}
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
        {/* SUBMIT SHIP PLACEMENTS */}
        <button onClick={() => {resetShipPlacements()}} className="bg-black/70 p-4 w-[13rem] rounded-lg">
          Reset ship placements
        </button>

    </div>
  </>
  )
}
