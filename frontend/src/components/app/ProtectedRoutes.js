import React, { useState, useEffect, useRef, createContext } from "react";
import { Routes, Route } from "react-router-dom";

import { useSessionTimeOutCheck } from "../../utility/LoggedInCheck";
import getSessionUserID from "../../utility/getSessionUserID";
import LoginPopup from "../auth/LoginPopup";
import { findUser } from "../../api_calls/usersAPI";

import NavBar from "../navbar/NavBar";
import GamesLobby from "../games_lobby/GamesLobby2";
import TicTacToe from "../../games/tictactoe/TicTacToe_Lowpoly";
import ProfilePage from "../profile_page/ProfilePage";
import MessagePage from "../messages/MessagePage";
// import GamePage from '../game-page/GamePage';
import GamePage from "../game_pages/GamePage";
import TTTGamePage from "../game_pages/TTTGamePage";
// import { SessionContextProvider } from "../context/SessionContext";

export const SessionContext = createContext(); // see line 47

const ProtectedRoutes = ({ navigate }) => {
  // =========== TOKEN & SESSION USER DATA =======================
  const [token, setToken] = useState(window.localStorage.getItem("token"));
  const sessionUserID = getSessionUserID(token);
  const [sessionUser, setSessionUser] = useState(null);

  // On component mount, get sessionUser Data
  useEffect(() => {
    if (token && sessionUserID) {
      findUser(token, sessionUserID).then((userData) => {
        window.localStorage.setItem("token", userData.token);
        setToken(window.localStorage.getItem("token"));
        setSessionUser(userData.user);
        console.log(userData.user);
        console.log(sessionUserID);
      });
    }
  }, []);

  // ============= LOGIN POPUP & TIMEOUT CHECKER ===================
  const showLoginPopup = !useSessionTimeOutCheck(); // checks every 5 seconds if token is valid and changes true/false

  // =================== JSX FOR COMPONENT ===================================
  if (token && sessionUserID) {
    return (
      <SessionContext.Provider
        value={{
          token,
          setToken,
          sessionUserID,
          sessionUser,
          setSessionUser,
        }}
      >
        <div className="h-screen w-screen flex flex-row overflow-scroll">
          {/* FULL PAGE */}

          {/* LOGGED OUT POPUP */}
          {showLoginPopup && (
            <div className="z-40 absolute h-full w-full">
              <LoginPopup navigate={navigate} />
            </div>
          )}

          {/* NAV BAR */}
          <div className="z-30 absolute h-full flex py-[1rem]">
            <NavBar />
          </div>

          {/* =============== MAIN PAGE ============================= */}
          <div className="h-full w-full flex flex-col overflow-none text-gray-50">
            <Routes>
              {/* ------ Lobby ------  */}
              <Route path="/" element={<GamesLobby />} />

              {/* ------ User Profile ------  */}
              <Route path="/users/:id" element={<ProfilePage />} />

              {/* ------ Tictactoe ------  */}
              <Route path="/tictactoe/:id" element={<TTTGamePage />} />

              {/* -------- RPS ----------- */}
              {/* <Route
                path="/rps/:gameId"
                element={
                  <GamePage
                    navigate={navigate}
                    gameTitle={"Rock Paper Scissors"}
                  />
                }
              /> */}

              {/* ---- Battleships ---- */}
            </Routes>
          </div>
        </div>
      </SessionContext.Provider>
    );
  }
};

export default ProtectedRoutes;
