import React from 'react'

export default function BattleshipsSetUpShipyard({placementShipyard, shipDirectionHorizontal, selectShip}) {
  return (
    <div className={`flex flex-${shipDirectionHorizontal ? "col" : "row"}`}>
      {placementShipyard.map((ship) => (
        
        // SHIP DIV
        <div 
        className={`flex flex-${shipDirectionHorizontal ? "row" : "col"} m${shipDirectionHorizontal ? "y" : "x"}-1`}
        key={ship.title}
        onClick={() => selectShip(ship)}
        >
          {/* SHIP DIV UNITS  */}
          {Array.from({ length: ship.units }, (_, index) => (
            <div
                key={index}
                className={`w-8 h-8 bg-red-400/70 mr-[0px]`}/>
          ))}
        </div>

      ))}
    </div>
  )
}
