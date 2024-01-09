import './App.css';
import React, { useState } from 'react';

// import Feed from '../feed/Feed'
import GamesLobby from '../games_lobby/GamesLobby';
import InfoPage from '../info-page/InfoPage';
import GamePage from '../game-page/GamePage';
import TicTacToe from '../../games/tictactoe/TicTacToe';
import TicTacToeTest from '../../games/tictactoe/TicTacToeTest';

import {
  useNavigate,
  Routes,
  Route,
} from "react-router-dom";

import LoginForm from '../auth/LoginForm'
import SignUpForm from '../sign_up/SignUpForm'
// import GamesLobby from '../games_lobby/GamesLobby';
// import TicTacToe from '../../games/tictactoe/TicTacToe';
import ProfilePage from '../profile_page/ProfilePage';
import Landing from '../landing/Landing';


const App = () => {
    return (
        <Routes>
          <Route path='/welcome'  element={<Landing navigate={ useNavigate() }/>}/>
          <Route path='/lobby'  element={<GamesLobby navigate={ useNavigate() }/>}/>
          <Route path='/login'  element={<LoginForm  navigate={ useNavigate() }/>}/>
          <Route path='/signup' element={<SignUpForm navigate={ useNavigate() }/>}/>
          <Route path='/tictactoe/:id' element={<TicTacToe navigate={useNavigate()} />} />
          <Route path='/rps' element={<InfoPage navigate={ useNavigate() } gameTitle={ "Rock Paper Scissors" }/>}/>
          <Route path='/rps/:gameId' element={<GamePage navigate={ useNavigate() } gameTitle={ "Rock Paper Scissors" }/>}/>
          <Route path='/users/:id' element={<ProfilePage navigate={useNavigate()}/>} />
        </Routes>
    );
}

export default App;
