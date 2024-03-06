import React, { useState } from "react";
import landingBg from "../../assets/dual-console-image-white.png";
import SignUpForm from "../sign_up/SignUpForm";
import LoginForm from "../auth/LoginForm";
import MiniNavBar from "../navbar/MiniNavBar";
import gameCardBattle from "../../assets/BS2.jpg";
import gameCardTTT from "../../assets/TTT.jpg";
import gameCardRPS from "../../assets/yellow-green-low-poly-landscape-1th24g6bt64mgokg.jpg";

const Landing = ({ navigate }) => {
  const basicFont =
    "pt-3 text-white text-lg font-light tracking-widest text-wrap";
  const h1Style = "pt-3 text-8xl text-white font-extrabold";
  const h2Style = "pt-3 mt-55 mb-20 text-5xl text-white font-bold text-center";
  const buttonStyle =
    "w-2/5 bg-purple-900 text-xl text-white font-semibold rounded-lg py-2 px-4 hover:bg-purple-600 focus:outline-purple-900 focus:shadow-outline-purple-900";

  const frostTexture = `
    backdrop-blur-md bg-purple-100/20 shadow-xl shadow-[#444a6b] border-[2.5px] border-white/10 place-self-center`;
  const popupContainer = "flex flex-col my-auto rounded-[2.5rem]";

  // =========== CHOOSING THE VIEW =====================
  // This stores the view state --> "Welcome", "Login", "Popup". If NOT Welcome, there is a pop up div with either the login or
  const [view, setView] = useState("Welcome");

  const viewWelcome = () => setView("Welcome");
  const viewLogin = () => setView("Login");
  const viewSignup = () => setView("Signup");

  // =========== JSX FOR UI =====================
  return (
    <>
      <div
        className="flex flex-row items-center justify-center"
        style={{
          backgroundImage: "url(/backgrounds/islandfar.jpg)",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto min-h-screen">
          {/* MINI NAV BAR FOR LANDING PAGE ONLY*/}
          <nav class="absolute top-6 right-20 m-4">
            <a
              class="bg-gray-700 mr-2 text-xl text-white font-semibold rounded-lg py-2 px-4 hover:bg-purple-600 focus:shadow-outline-purple-900"
              href="/welcome"
            >
              OPPO GAMES
            </a>
            <a
              class="bg-purple-900 mr-2 text-xl text-white font-semibold rounded-lg py-2 px-4 hover:bg-purple-600 focus:shadow-outline-purple-900"
              href="/login"
            >
              Log in
            </a>
            <a
              class="bg-purple-900 text-xl text-white font-semibold rounded-lg py-2 px-4 hover:bg-purple-600 focus:shadow-outline-purple-900"
              href="/signup"
            >
              Sign Up
            </a>
          </nav>

          {/* MINI NAV BAR */}
          <div className="flex justify-end">
            {/* WELCOME MESSAGE */}
            {view === "Welcome" ? (
              <>
                <div className="text-left w-3/5 pr-4">
                  <div className="flex flex-col h-dvh justify-center pr-40">
                    <h3 className="text-xl text-white font-semibold tracking-wider">
                      ONLINE MULTIPLAYER GAMING
                    </h3>
                    <h1 className={h1Style}>OPPO GAMES</h1>
                    <h2 className={basicFont}>
                      Welcome to Oppo Games. An online platform to participate
                      in retro, multiplayer games in live time. Join a game,
                      chat with your opponent and have fun!
                    </h2>

                    <div className="pt-6">
                      <button className={buttonStyle} onClick={viewLogin}>
                        START PLAYING
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* LOGIN/SIGNUP CONTAINER */}
                <div className={frostTexture + popupContainer}>
                  {view === "Signup" && (
                    <SignUpForm
                      navigate={navigate}
                      viewWelcome={viewWelcome}
                      viewLogin={viewLogin}
                    />
                  )}
                  {view === "Login" && (
                    <LoginForm
                      navigate={navigate}
                      viewWelcome={viewWelcome}
                      viewSignup={viewSignup}
                    />
                  )}
                </div>
              </>
            )}

            <div className="w-2/5 min-h-screen flex flex-col justify-center">
              {/* <img
                    src={landingBg}
                    alt="3d-game-console-in-purple"
                    width="700px"
                    className="transition duration-500 ease-in-out transition-transform hover:scale-110"
                ></img> */}
            </div>
          </div>

          {/* 3 CARD IMAGES STARTS HERE  */}

          <h1 className={h2Style}>EXPLORE OUR LATEST GAMES</h1>
          {/* <div class="grid grid-cols-3 gap-6 mr-20 ml-20 "> */}
          <div class="mr-20 ml-20 ">
            {/* TTT - Card 1 */}
            <div class="min-h-[140px] w-full place-items-left overflow-x-scroll rounded-lg p-6 lg:overflow-visible relative">
              <figure class="w-full h-96 relative hover:opacity-50 transition-opacity">
                <a aria-label="Link to Register" href="/tictactoe">
                  <img
                    class="object-cover object-center w-full h-full rounded-xl"
                    src={gameCardTTT}
                    alt="nature image"
                  />
                  <figcaption class="absolute bottom-8 left-2/4 transform -translate-x-2/4 flex w-[calc(100%-4rem)] -translate-x-2/4 justify-between rounded-xl border border-white bg-white/75 py-4 px-6 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm">
                    <div class="transition-opacity hover:opacity-0">
                      <h5 class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                        Tic Tac Toe
                      </h5>
                      <p class="block mt-2 font-sans text-base antialiased font-normal leading-relaxed text-gray-700">
                        play against a player and win
                      </p>
                    </div>
                    <h5 class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                      234 players online
                    </h5>
                  </figcaption>
                </a>
              </figure>
            </div>

            {/* RPS Card 2 */}
            <div class="min-h-[140px] w-full place-items-left overflow-x-scroll rounded-lg lg:overflow-visible relative">
              <div class="min-h-[140px] w-full place-items-left overflow-x-scroll rounded-lg p-6 lg:overflow-visible relative">
                <figure class="w-full h-96 relative hover:opacity-50 transition-opacity">
                  <a aria-label="Link to Register" href="/rps">
                    <img
                      class="object-cover object-center w-full h-full rounded-xl"
                      src={gameCardRPS}
                      alt="nature image"
                    />
                    <figcaption class="absolute bottom-8 left-2/4 transform -translate-x-2/4 flex w-[calc(100%-4rem)] -translate-x-2/4 justify-between rounded-xl border border-white bg-white/75 py-4 px-6 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm">
                      <div class="transition-opacity ">
                        <h5 class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                          Rock, Paper, Scissors
                        </h5>
                        <p class="block mt-2 font-sans text-base antialiased font-normal leading-relaxed text-gray-700">
                          play against a player and win
                        </p>
                      </div>
                      <h5 class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                        108 players online
                      </h5>
                    </figcaption>
                  </a>
                </figure>
              </div>
            </div>

            {/* BATTLESHIPS Card 3 */}
            <div class="min-h-[140px] w-full place-items-left overflow-x-scroll rounded-lg lg:overflow-visible relative">
              <div class="min-h-[140px] w-full place-items-left overflow-x-scroll rounded-lg p-6 lg:overflow-visible relative">
                <figure class="w-full h-96 relative hover:opacity-50 transition-opacity">
                  <a aria-label="Link to Register" href="/battleships">
                    <img
                      class="object-cover object-center w-full h-full rounded-xl"
                      src={gameCardBattle}
                      alt="nature image"
                    />
                    <figcaption class="absolute bottom-8 left-2/4 transform -translate-x-2/4 flex w-[calc(100%-4rem)] -translate-x-2/4 justify-between rounded-xl border border-white bg-white/75 py-4 px-6 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm">
                      <div class="transition-opacity hover:opacity-0">
                        <h5 class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                          Battleships
                        </h5>
                        <p class="block mt-2 font-sans text-base antialiased font-normal leading-relaxed text-gray-700">
                          play against a player and win
                        </p>
                      </div>
                      <h5 class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                        84 players online
                      </h5>
                    </figcaption>
                  </a>
                </figure>
              </div>
            </div>
          </div>

          {/* 3 CARD IMAGES STARTS ENDS */}
        </div>
      </div>
    </>
  );
};

export default Landing;
