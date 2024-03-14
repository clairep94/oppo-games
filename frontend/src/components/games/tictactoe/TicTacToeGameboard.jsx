import React, { useEffect } from 'react'

export default function TicTacToeGameboard({ gameBoard, handleButtonClick }) {

  // ============ SESSION USER GAMEPLAY =================================
  const rows = ["A", "B", "C"];

  // =================================== JSX FOR UI ==============================================================
  return (
    <>
        {/* TTT GAME BOARD */}
        <div className="tictactoe-board">
          {rows.map(row => (
            <div key={row} className="tictactoe-row flex">
              {Object.keys(gameBoard[row]).map(col => (
                <button
                  key={col}
                  className="h-[6rem] w-[6rem] mb-2 text-[2rem] bg-slate-400/40 border-2 border-white/20 shadow-sm text-black/80 rounded-md mr-1 hover:bg-slate-400 font-semibold flex items-center justify-center"
                  onClick={() => handleButtonClick(row, col)}
                >
                  {gameBoard[row][col]}
                </button>
              ))}
            </div>
          ))}
        </div>
    </>
  );
}
