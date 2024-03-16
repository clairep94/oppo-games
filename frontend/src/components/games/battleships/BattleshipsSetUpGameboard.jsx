import React, {useState, useRef, useEffect} from "react";
import BattleshipsSetUpShipyard from "./BattleshipsSetUpShipyard";

export default function BattleshipsSetUpGameboard({game, submitPlacements, sessionUserID, setErrorMessage}) {

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
    const [placementBoard, setPlacementBoard] = useState(() => (
        Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ""))
    ));
     // STORES THE WORKING STATE OF THE PLACEMENT BOARD
    const [placementShipyard, setPlacementShipyard] = useState(resetShipYard); // STORES THE WORKING STATE OF THE SHIPYARD

    const [shipDirectionHorizontal, setShipDirectionHorizontal] = useState(true);
    const [currentShip, setCurrentShip] = useState(null);
    const [hoveredUnits, setHoveredUnits] = useState([]);


    // ================= FUNCTIONS FOR SELECTION SHIP PLACEMENTS =============================

    // SELECTING A SHIP
    const selectShip = (shipType) => {
        if (shipType === currentShip) {
            setCurrentShip(null);
        } else {
            setCurrentShip(shipType)
            console.log(`Selecting ${shipDirectionHorizontal ? "Horizontal" : "Vertical"} Ship: `, currentShip)
        }
        setErrorMessage("")
    }

    // PLACING A SHIP
    const placeShip = (row, col) => {
        if (currentShip) {
            const shipLength = currentShip.units;
            const code = currentShip.code;
            let newBoard = [...placementBoard];
            let currentRowIndex = row;
            let currentColIndex = col;
            let outOfBounds = false;
    
            // Check if all units are valid (in bounds & empty)
            for (let i = 0; i < shipLength; i++) {
                if (currentRowIndex >= 10 || currentColIndex >= 10) {
                    outOfBounds = true;
                    setErrorMessage("Selected ship placement is out of bounds");
                    break;
                }
    
                if (newBoard[currentRowIndex][currentColIndex] !== "") {
                    setErrorMessage("Selected ship placement overlaps with another ship");
                    return;
                }
    
                if (shipDirectionHorizontal) {
                    currentColIndex++;
                } else {
                    currentRowIndex++;
                }
            }
    
            if (!outOfBounds) {
                // Update the board only if not out of bounds
                let updatedBoard = [...placementBoard];
                let updatedShipyard = [...placementShipyard];
                currentRowIndex = row;
                currentColIndex = col;
    
                for (let i = 0; i < shipLength; i++) {
                    updatedBoard[currentRowIndex][currentColIndex] = code;
    
                    if (shipDirectionHorizontal) {
                        currentColIndex++;
                    } else {
                        currentRowIndex++;
                    }
                }
    
                // Update the shipyard
                updatedShipyard = updatedShipyard.map(ship => {
                    if (ship.title === currentShip.title) {
                        return { ...ship, placed: true };
                    }
                    return ship;
                });
    
                // Update state
                setPlacementBoard(updatedBoard);
                setPlacementShipyard(updatedShipyard);
                setCurrentShip(null);
            } else {
                setErrorMessage("Selected ship placement is out of bounds");
            }
        }
    };
    

    // FINDING THE UNITS NEEDED
    // const findTargetUnits = (startingRowIndex, startingColIndex) => {
    //     const shipLength = currentShip.units;
    //     let units = [];
    //     let currentRowIndex = startingRowIndex;
    //     let currentColIndex = startingColIndex;

    //     while (units.length < shipLength) {
    //         units.push([currentRowIndex, currentColIndex]);

    //         if (shipDirectionHorizontal) {
    //             currentColIndex++;
    //         } else {
    //             currentRowIndex++;
    //         }
    //         // Add a condition to catch if we are going beyond the array bounds
    //         if (currentRowIndex >= 10 || currentColIndex >= 10) {
    //             setErrorMessage("Selected ship placement is out of bounds")
    //             return null;
    //         }
    //     }
    //     console.log("Found units: ", units)
    //     setErrorMessage("")
    //     return units
    // }


    // ADD A HOVER FUNCTION --> on hover, change the colour of the units that will be selected
    const handleHoverEnter = (row, col) => {
        if (!currentShip) return; // If no ship is selected, do nothing

        const shipLength = currentShip.units;
        const newHoveredUnits = [];
        let currentRowIndex = row;
        let currentColIndex = col;
        let outOfBounds = false;

        // Check if all units are valid (in bounds & empty)
        for (let i = 0; i < shipLength; i++) {
            if (currentRowIndex >= 10 || currentColIndex >= 10) {
                outOfBounds = true;
                break;
            }

            if (placementBoard[currentRowIndex][currentColIndex] !== "") {
                // Overlapping with another ship
                return;
            }

            newHoveredUnits.push([currentRowIndex, currentColIndex]);

            if (shipDirectionHorizontal) {
                currentColIndex++;
            } else {
                currentRowIndex++;
            }
        }

        if (!outOfBounds) {
            setHoveredUnits(newHoveredUnits);
        }
    };

    const handleHoverLeave = () => {
        setHoveredUnits([]);
    };

    // RESETTING THE SHIP PLACEMENTS
    const resetShipPlacements = () => {
        console.log("Resetting ship placements")
        setCurrentShip(null);
        // placementBoard = resetShipPlacements
        setPlacementBoard(emptyBoard);
        setPlacementShipyard(resetShipYard);
        setErrorMessage("")
    }

    // ================= FUNCTION FOR SUBMITTING SHIP PLACEMENTS =============================

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
            {/* SETUP SHIPYARD */}
            <BattleshipsSetUpShipyard placementShipyard={placementShipyard} shipDirectionHorizontal={shipDirectionHorizontal} selectShip={selectShip}
            currentShip={currentShip}
            />
        </div>

        {/* BOARD */}
        <div className="flex flex-col w-full h-full bg-green-50/10">
            <h5 className="font-bold text-[2rem]">
                Your Board
            </h5>

            <div className="grid grid-cols-10 gap-0 w-[20rem]">
                        {placementBoard.map((row, rowIndex) => (
                            row.map((element, colIndex) => {
                                const isHovered = hoveredUnits.some(([hoverRow, hoverCol]) => hoverRow === rowIndex && hoverCol === colIndex);
                                const cellColor = isHovered ? "bg-green-500 hover:bg-green-600" : "";
                                return (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className={`${element} ${cellColor} border border-black w-8 h-8 cursor-pointer`}
                                        onClick={() => placeShip(rowIndex, colIndex)}
                                        onMouseEnter={() => handleHoverEnter(rowIndex, colIndex)}
                                        onMouseLeave={handleHoverLeave}
                                    >
                                        {element}
                                    </div>
                                );
                            })
                        ))}
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
