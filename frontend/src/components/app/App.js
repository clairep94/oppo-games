import './App.css';
import React, { useState } from 'react';


import InfoPage from '../info-page/InfoPage';

import {
  useNavigate,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { isLoggedIn } from '../../utility/LoggedInCheck';

import LoginPage from '../auth/LoginPage'
import SignUpPage from '../sign_up/SignUpPage'
// import GamesLobby from '../games_lobby/GamesLobby';
// import TicTacToe from '../../games/tictactoe/TicTacToe';
import ProfilePage from '../profile_page/ProfilePage';
import Landing from '../landing/Landing';
import ProtectedRoutes from './ProtectedRoutes';

const App = () => {
  const navigate = useNavigate();
  
  return (
    
    <Routes>
      {/* ====== NO AUTHENTICATION - Sign Up or Login: ======== */}

      <Route path='/rps' element={<InfoPage navigate={ useNavigate() } gameTitle={ "Rock Paper Scissors" }/>}/>

      <Route path='/welcome'  element={!isLoggedIn() ?
      <Landing navigate={ navigate }/> : <Navigate to='/'/>}/>

      <Route path='/signup' element={ !isLoggedIn() ?
      <SignUpPage navigate={navigate}/> : <Navigate to='/'/>}/>
      
      <Route path='/login' element={ !isLoggedIn() ?
        <LoginPage navigate={navigate}/> : <Navigate to='/'/>}/>

      {/* ====== AUTHENTICATION ONLY - Lobby, Games, etc. : ======== */}
      <Route path='/*'  element={ isLoggedIn() ?         
        <ProtectedRoutes navigate={navigate}/> : <Navigate to='/welcome'/>}/>
        
    </Routes>
  )}
export default App;
