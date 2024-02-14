import "./App.css";
// eslint-disable-next-line no-unused-vars
import React, { useState } from "react";

import RpsInfoPage from "../InfoPage/RpsInfoPage";

import { useNavigate, Routes, Route, Navigate } from "react-router-dom";

import { isLoggedIn } from "../../utility/LoggedInCheck";

import LoginPage from "../auth/LoginPage";
import SignUpPage from "../sign_up/SignUpPage";
import Landing from "../landing/Landing";
import ProtectedRoutes from "./ProtectedRoutes";
import TttInfoPage from "../InfoPage/TttInfoPage";
import BattleInfoPage from "../InfoPage/BattleshipsInfoPage";

const App = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* ====== NO AUTHENTICATION - Sign Up or Login: ======== */}
      {isLoggedIn() ? (
        <Route path="/*" element={<ProtectedRoutes navigate={navigate} />} />
      ) : (
        <>
          <Route
            path="/rps"
            element={
              <RpsInfoPage
                navigate={navigate}
                gameTitle={"Rock Paper Scissors"}
              />
            }
          />
          <Route
            path="/tictactoe"
            element={
              <TttInfoPage navigate={navigate} gameTitle={"Tic Tac Toe"} />
            }
          />
          <Route
            path="/battleships"
            element={
              <BattleInfoPage navigate={navigate} gameTitle={"Battleships"} />
            }
          />

          <Route path="/welcome" element={<Landing navigate={navigate} />} />
          <Route path="/signup" element={<SignUpPage navigate={navigate} />} />
          <Route path="/login" element={<LoginPage navigate={navigate} />} />
        </>
      )}
    </Routes>
  );
};
export default App;

// emerald-400
// emerald-700
// purple-700
