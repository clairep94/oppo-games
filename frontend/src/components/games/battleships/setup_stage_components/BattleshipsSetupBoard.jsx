import React, {useState, useRef, useEffect} from "react";

export default function BattleshipsSetupBoard(props) {

  // ================= STATE VARIABLES =============================
  const {
    currentShip,
    setCurrentShip,
    shipDirectionHorizontal,
    placementBoard,
    setPlacementBoard,
    placementShipyard,
    setPlacementShipyard,
    setErrorMessage,
    TWUnitSize
    } = props;

  const [hoveredUnits, setHoveredUnits] = useState([]); // Array of units that are hovered over for colour-change
  const [hasError, setHasError] = useState(false); // Turns hover units a different colour if there is an error
  

  // ================= FUNCTION FOR HANDLING BOARD CLICKS =============================
  const handleClick = (row, col) => {
    if (currentShip) {
      placeShip(row,col)
    } else {
      if (placementBoard[row][col] !== ""){
        resetSingleShip(row, col)
      }
    }
  }
  
  // ------------- PLACING A SHIP -------------------
  const placeShip = (row, col) => {

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
      
  };


  // ------------- RESETTING A SHIP -------------------
  const resetSingleShip = (row, col) => {
    const updatedBoard = [...placementBoard];
    const updatedShipyard = [...placementShipyard];
    const shipCode = updatedBoard[row][col];

    updatedBoard.forEach((row, rowIndex) => {
        row.forEach((element, colIndex) => {
            if (element === shipCode) {
                updatedBoard[rowIndex][colIndex] = ""; // Reset the board cell
            }
        });
    });

    const resetShip = updatedShipyard.find(ship => ship.code === shipCode);
    if (resetShip) {
        resetShip.placed = false; // Reset the ship's placed status
    }

    setPlacementBoard(updatedBoard);
    setPlacementShipyard(updatedShipyard);
    setCurrentShip(null);
};



  // ================= FUNCTION FOR HANDLING HOVERING =============================
  const handleHoverEnter = (row, col) => {
    if (!currentShip) return; // If no ship is selected, do nothing

    const shipLength = currentShip.units;
    const newHoveredUnits = [];
    let currentRowIndex = row;
    let currentColIndex = col;
    let outOfBounds = false;
    let hasIntersection = false;

    // Check if all units are valid (in bounds & empty)
    while (!outOfBounds && newHoveredUnits.length < shipLength){

      if (currentColIndex === 10 || currentRowIndex === 10) {
          outOfBounds = true
      } else {
        if (placementBoard[currentRowIndex][currentColIndex] !== "") {
            // Overlapping with another ship
            hasIntersection = true;
        }
        newHoveredUnits.push([currentRowIndex, currentColIndex]);
        if (shipDirectionHorizontal){
            currentColIndex ++;
        } else {
            currentRowIndex ++;
        }
      }
    }
    setHoveredUnits(newHoveredUnits);
    setHasError(outOfBounds || hasIntersection);
  };

  const handleHoverLeave = () => {
    setHoveredUnits([]);
    setHasError(false);
  };


  // ================= FUNCTION FOR SUBMITTING SHIP PLACEMENTS =============================
  return (
    <div className="grid grid-cols-10 gap-0 w-[20rem]">

      {/* WHOLE BOARD */}
      {placementBoard.map((row, rowIndex) => (
        row.map((element, colIndex) => {
          const isHovered = hoveredUnits.some(([hoverRow, hoverCol]) => hoverRow === rowIndex && hoverCol === colIndex);
          const cellColor = isHovered ? (
            hasError ?  "bg-red-500 hover:bg-red-600":
            "bg-green-500 hover:bg-green-600"
          ) : "";
          
          // SINGLE UNIT
          return(
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`${element} ${cellColor} border border-black w-${TWUnitSize} h-${TWUnitSize} cursor-pointer text-center`}
              onClick={() => handleClick(rowIndex, colIndex)}
              onMouseEnter={() => handleHoverEnter(rowIndex, colIndex)}
              onMouseLeave={handleHoverLeave}
            >
              {element}
            </div>
          )
        }
      )
    ))}
    </div>
  )
}
