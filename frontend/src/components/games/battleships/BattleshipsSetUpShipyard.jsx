import React from 'react'

export default function BattleshipsSetUpShipyard({placementShipyard, shipDirectionHorizontal, selectShip, currentShip}) {
  const unitSize = 8

  return (
    <div className={`flex flex-${shipDirectionHorizontal ? "col" : "row"}`}>
      {placementShipyard.map((ship) => (
        // SHIP DIV        
        <div
          key={ship.title}
          className={`
          ${shipDirectionHorizontal ? "w" : "h"}-${unitSize * ship.units}
          ${shipDirectionHorizontal ? "h" : "w"}-${unitSize}
          ${currentShip === ship ? " bg-gray-300/70":"bg-red-400/70"}
          mr-2 mb-2
          `}
          onClick={() => selectShip(ship)}
        />

      ))}
    </div>
  )
}