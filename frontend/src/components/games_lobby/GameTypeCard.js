import React, { useState } from "react";

export default function GameTypeCard({ game, index, showGames, createGame }) {
  const [viewFront, setViewFront] = useState(true);

  // ============== FLIPPING THE CARD =========================
  const flipToFront = () => {
    setViewFront(true);
  };

  const flipToBack = () => {
    setViewFront(false);
  };

  const flipCard = () => {
    setViewFront(!viewFront);
  };

  // ============ TAILWIND =====================
  const buttonStyle1 =
    "w-[80%] text-lg text-white font-semibold rounded-lg py-3 px-4 bg-pink-600/50 hover:bg-pink-600/70 focus:outline-none focus:shadow-outline-pink active:bg-pink-700/80";
  const buttonStyle2 =
    "w-[80%] text-lg text-white font-semibold rounded-lg py-3 px-4 border-2 border-pink-600/50 hover:bg-pink-600/20 focus:outline-none focus:shadow-outline-pink active:bg-pink-700/80";

  // =========== CREATE GAME & FILTER =============
  const handleCreateButtonClick = (e) => {
    e.stopPropagation(); // Prevents the click event from reaching the parent container
    createGame(game);
  };

  const handleViewButtonClick = (e) => {
    e.stopPropagation(); // Prevents the click event from reaching the parent container
    showGames(game.title);
  };

  // ============== JSX FOR UI ========================
  return (
    <div
      id={index}
      className="h-[full] min-w-[35rem] rounded-[1rem] overflow-clip flex flex-col relative text-black hover:cursor-pointer transition-opacity opacity-90 hover:opacity-100"
      // onClick={flipCard}
      onMouseEnter={flipToBack}
      onMouseLeave={flipToFront}
    >
      {viewFront ? (
        <>
          {/* CARD FRONT */}
          <img
            className="object-cover object-center w-full h-full rounded-xl"
            src={game.imgSource}
            alt="ttt"
          />
          <figcaption className="absolute bottom-8 left-2/4 transform flex w-[calc(100%-4rem)] -translate-x-2/4 justify-between rounded-xl border border-white bg-white/75 py-4 px-6 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm">
            <div className="transition-opacity hover:opacity-0">
              <h5 className="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                {game.title}
              </h5>
              <p className="block mt-2 font-sans text-base antialiased font-normal leading-relaxed text-gray-700">
                Play in the {game.mapName}
              </p>
            </div>
            <h5 className="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
              {game.hardCodePlayersOnline} players online
            </h5>
          </figcaption>
        </>
      ) : (
        <div className="h-full w-full bg-black/60 text-white items-center justify-center flex flex-col">
          {/* CARD BACK */}
          <h3 className="font-bold text-2xl">Play {game.title}</h3>
          <div className="w-full flex flex-col justify-center items-center mt-5 space-y-2">
            <button className={buttonStyle1} onClick={handleCreateButtonClick}>
              Create a new {game.title} game
            </button>
            <button className={buttonStyle2} onClick={handleViewButtonClick}>
              View all {game.title} Games
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
