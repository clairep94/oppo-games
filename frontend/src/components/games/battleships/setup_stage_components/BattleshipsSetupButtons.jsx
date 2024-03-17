import React from 'react';

export default function BattleshipsSetupButtons(props) {

  // RESETTING THE SHIP PLACEMENTS
  const resetShipPlacements = () => {
    console.log("Resetting ship placements");
    props.setCurrentShip(null);
    props.setPlacementBoard(props.emptyBoard);
    props.setPlacementShipyard(props.resetShipYard);
    props.setErrorMessage("");
  };

  // TOGGLING SHIP PLACEMENTS
  const toggleShipDirection = () => {
    props.setShipDirectionHorizontal(!props.shipDirectionHorizontal);
    props.setErrorMessage("");
  };

  // SUBMIT SHIP PLACEMENTS --> API Call is held in Battleships Setup Gameboard component


  // TAILWIND:
  const buttonStyle = "bg-pink-500/70 p-4 w-[13rem] rounded-lg"

  const secondButtonStyle = "bg-black/70 p-4 w-[13rem] rounded-lg"


  // =================================== JSX FOR UI ==============================================================

  return (
    <div className="flex flex-row space-x-2">
      {/* TOGGLE SHIPS BUTTON */}
      <button onClick={toggleShipDirection} className={buttonStyle}>
        Toggle Ship Direction
      </button>
      {/* SUBMIT SHIP PLACEMENTS */}
      <button onClick={props.submitPlacements} className={buttonStyle}>
        Submit ships
      </button>
      {/* RESET SHIP PLACEMENTS */}
      <button onClick={resetShipPlacements} className={secondButtonStyle}>
        Reset ship placements
      </button>
    </div>
  );
}
