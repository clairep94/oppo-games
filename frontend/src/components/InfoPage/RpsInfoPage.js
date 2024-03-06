import React, { useState, useEffect } from "react";
import MiniNavBar from "../navbar/MiniNavBar";
import gameCardRPSImage from "../../assets/RPS.jpg"
import rpsSingle from "../../assets/rock-papaer-scissors-header.png" // TODO: Change to rock paper scissors images
import gameCardBattle from "../../assets/BS2.jpg"
import gameCardTTT from "../../assets/TTT.jpg"


//STYLE VARS
const buttonStyleGamePage = "pr-20 pl-20 bg-purple-900 text-xl text-white font-semibold rounded-lg py-2 px-4 hover:bg-purple-600 focus:outline-purple-900 focus:shadow-outline-purple-900 active:bg-emerald-700";
const bgGradient = "bg-gradient-to-br from-emerald-400 via-emerald-700 to-purple-700 h-screen"
const basicFont = "p-12 text-white text-lg font-medium tracking-wide text-wrap text-center"
const h1Style = "pt-3 text-6xl text-white font-extrabold text-center"
const h2Style = "pt-3 mt-55 mb-20 text-5xl text-white font-bold text-center"



const RpsInfoPage = ({ navigate, gameTitle }) => {

  const gameCardRPS = {
    backgroundImage: `url(${gameCardRPSImage})`,
 //color and opacity???
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  };

  const [token, setToken] = useState(window.localStorage.getItem("token"));
  const startAndRedirectToNewGame = () => {
    if (!token) {
      navigate("/login");
      return;
    }
    let gamePath = null;
    if (gameTitle === "Rock Paper Scissors") {
      gamePath = "rps";
    } else {
      throw new Error("unrecognised game :(");
    }
    fetch(`/${gamePath}`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        shouldJoin: true,
      }),
    })
    .then((res) => {
      if (res.status === 500) {
        throw res.json().error;
      }
      return res.json();
    })
    .then((data) => {
      window.localStorage.setItem("token", data.token);
      navigate(`/${gamePath}/${data.gameId}`);
    })
    .catch((error) => console.error(error));
  };
  if (gameTitle === "Rock Paper Scissors") {
    return (
      <>
      <div class="bg-auto min-h-screen " style={gameCardRPS}>
      
        <MiniNavBar />
        {/* <div class="bg-black/50 relative left-2/4 transform -translate-x-2/4 text-center -translate-x-2/4 py-4 px-6 shadow-lg saturate-200 backdrop-blur-sm">
        <h1 className={h1Style}>Rock Paper Scissors</h1>
        </div> */}
        <div class="container mx-auto mt-28 px-20">
        <div class="flex justify-end pb-20">
        <div class="pr-4">
        
        

        <div className="pb-20 items-center flex flex-col min-h-full justify-center rounded-xl bg-gray-600/50 py-4 px-6 shadow-lg shadow-black/9 saturate-200 backdrop-blur-sm">
            <img 
                src={rpsSingle} 
                alt="3d-game-console-in-purple" 
                width="500px"
                className="transition duration-500 ease-in-out transition-transform hover:scale-110"
                ></img>

        <h1 className={h1Style}>Rock Paper Scissors</h1>
        <div class="container pr-60 pl-60">
        <p className={basicFont}> 
          Simultaneous moves? How does that work? With our hidden information game system,
          you can be sure that your opponent won't see what you're up to before they have
          to make their best move - and stick with it. If you're logged in, click the button
          below to start a new Rock Paper Scissors game and be redirected to its page. If
          you're not logged in, it will redirect you to the login screen, where you can create
          an account to play all the different games on our website and chat with other players.
        </p>
        </div>

        <div className="pt-6">

        <a className="flex items-center justify-center" aria-label="Link to Register" href="/login">
        <button 
        className={buttonStyleGamePage}
        onClick={startAndRedirectToNewGame}>
        START PLAYING 
        </button>
        </a>

        </div>

        </div>
        </div>
        </div>
      
      {/* 2 cards for other games */}
        <h1 className={h2Style}>EXPLORE OUR LATEST GAMES</h1>
        <div class="grid grid-cols-2 gap-4 mr-20 ml-20 ">
  {/* TTT - Card 1 */}
        <div class="min-h-[140px] w-full place-items-left overflow-x-scroll rounded-lg p-6 lg:overflow-visible relative">
        <figure class="w-full h-96 relative hover:opacity-50 transition-opacity">
        <a aria-label="Link to Register" href="/tictactoe"> 
            <img class="object-cover object-center w-full h-full rounded-xl" src={gameCardTTT} alt="nature image" />
            <figcaption class="absolute bottom-8 left-2/4 transform -translate-x-2/4 flex w-[calc(100%-4rem)] -translate-x-2/4 justify-between rounded-xl border border-white bg-white/75 py-4 px-6 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm">
                <div class="transition-opacity hover:opacity-0">
                <h5 class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                    Tic Tac Toe
                </h5>
                <p class="block mt-2 font-sans text-base antialiased font-normal leading-relaxed text-gray-700">
                    play against a player and win
                </p>
                </div>
            </figcaption>
            </a>
            </figure>
        </div>

        {/* BATTLESHIPS Card 3 */}
        <div class="min-h-[140px] w-full place-items-left overflow-x-scroll rounded-lg lg:overflow-visible relative">
        <div class="min-h-[140px] w-full place-items-left overflow-x-scroll rounded-lg p-6 lg:overflow-visible relative">
        <figure class="w-full h-96 relative hover:opacity-50 transition-opacity">
        <a aria-label="Link to Register" href="/battleships">
            <img class="object-cover object-center w-full h-full rounded-xl" src={gameCardBattle} alt="nature image" />
            <figcaption class="absolute bottom-8 left-2/4 transform -translate-x-2/4 flex w-[calc(100%-4rem)] -translate-x-2/4 justify-between rounded-xl border border-white bg-white/75 py-4 px-6 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm">
                <div class="transition-opacity hover:opacity-0">
                <h5 class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                    Battleships
                </h5>
                <p class="block mt-2 font-sans text-base antialiased font-normal leading-relaxed text-gray-700">
                    play against a player and win
                </p>
                </div>
            </figcaption>
            </a>
            </figure>
        </div>
        </div>
        </div>
    </div>

    

    <div class="bg-black/50 relative left-2/4 transform -translate-x-2/4 text-center -translate-x-2/4 px-6 shadow-lg saturate-200 backdrop-blur-sm">
      <footer class="text-center py-7 text-white">
      <p>&copy; 2024 OTTO Games. All rights reserved. A web development project by Claire, Onuora, Perran, Ray, Romain, Sudhansh & Tej</p>
        </footer>
      </div>








        </div>
      </>
    );
  }
};

export default RpsInfoPage;
