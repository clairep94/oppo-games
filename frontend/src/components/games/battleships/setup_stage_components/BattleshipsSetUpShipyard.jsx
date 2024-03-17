import React from 'react'

export default function BattleshipsSetUpShipyard(props) {

  // FUNCTION FOR SELECTION A SHIP
  const selectShip = (shipType) => {
    if (shipType === props.currentShip) {
      props.setCurrentShip(null);
    } else {
      props.setCurrentShip(shipType)
        console.log(`Selecting ${props.shipDirectionHorizontal ? "Horizontal" : "Vertical"} Ship: `, props.currentShip)
    }
    props.setErrorMessage("")
  }

  // =================================== JSX FOR UI ==============================================================
  return (
    <div className={`flex flex-${props.shipDirectionHorizontal ? "col" : "row"}`}>
      {props.placementShipyard.filter((ship) => ship.placed === false).map((ship) => (
      // SHIP DIV        
        <div
          key={ship.title}
          className={`
          ${props.shipDirectionHorizontal ? "w" : "h"}-${props.TWUnitSize * ship.units}
          ${props.shipDirectionHorizontal ? "h" : "w"}-${props.TWUnitSize}
          ${props.currentShip === ship ? " bg-gray-300/70":"bg-red-400/70"}
          mr-2 mb-2
          `}
          onClick={() => selectShip(ship)}
        />
      ))}
    </div>
  )
}