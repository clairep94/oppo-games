import React, {useState, useRef, useEffect} from "react";

export default function BattleshipsAttackBoard({ attackBoard, launchMissile, TWUnitSize, owner }) {

  // ================= STATE VARIABLES =============================
  const [hoveredUnit, setHoveredUnit] = useState(null); // Array of units that are hovered over for colour-change
  const [hasError, setHasError] = useState(false); // Turns hover units a different colour if there is an error
  
  // ================= FUNCTION FOR HANDLING HOVERING =============================
  const handleHoverEnter = (row, col) => {
    setHoveredUnit([row, col]); 
    if (attackBoard[row][col] !== "") {
      setHasError(true); 
    }
  };

  const handleHoverLeave = () => {
    setHoveredUnit(null);
    setHasError(false);
  };


  // ================= FUNCTION FOR SUBMITTING SHIP PLACEMENTS =============================
  return (
    <div className="grid grid-cols-10 gap-0 w-[20rem]">

      {/* WHOLE BOARD */}
      {attackBoard.map((row, rowIndex) => (
        row.map((element, colIndex) => {
          const cellColor = (hoveredUnit && JSON.stringify(hoveredUnit) === JSON.stringify([rowIndex, colIndex])) ? (
            (hasError || owner) ?  "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          ) : "";
          
          // SINGLE UNIT
          return(
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`${element} ${cellColor} border border-black w-${TWUnitSize} h-${TWUnitSize} cursor-pointer text-center justify-center flex flex-col`}
              onClick={() => launchMissile(rowIndex, colIndex, owner)}
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
