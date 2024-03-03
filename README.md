# OppoGames | Play Live Mini-Games with Friends

![Screenshot 2024-01-12 at 02 33 41](https://github.com/clairep94/fp_team6_battleships/assets/128436909/1bd288a9-7537-4ca7-9165-0f002f89bb73)

OppoGames is a fullstack social-gaming site, showcasing use of the MERN stack, Socket.io and Tailwind CSS.

Users can sign up, log in, and play a number of mini-games 1v1 with other users. Users can see their opponents moves and message in real-time.

**This is my personal extension of the [Oppo Games - Group 6 final project at Makers Academy](https://github.com/clairep94/oppo-games-group6).**

- Please see [**Feature Updates**](#feature-updates) below for ongoing feature implementation updates.

<br>

## Table of Contents

- [Demo](#demo)
- [Feature Updates](#feature-updates)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Running the Tests](#running-the-tests)

<br>

## Demo

https://github.com/clairep94/oppo-games-group6/assets/128436909/fe225b5f-cd23-4050-81b2-360373d5b208

<details>
  <summary>Features</summary>
  
    * Users can view a description of each of our games
    * Users can register and see errors if they do not have a unique email and username, or if their password does not have a set length and char set
    * Users can see a game lobby, filter by game type or open status or ownership
    * Users can create a game
    * Users can see errors if they try to play without an opponent
    * Users can join games, play and message opponents in realtime
    * Users can see errors if they try to play out-of-turn or play out-of-bounds moves
    * Users can go back to past games to see the last game-state and message history
    
</details>
<br>

## Feature Updates

<details>
  <summary>Click Me</summary>
  
**Feb 4, 2024:**
<br>
<img width="350" alt="Screenshot 2024-02-04 at 18 21 14" src="https://github.com/clairep94/oppo-games/assets/128436909/f66d7c02-bc71-41c2-9db0-6cee062dba1c">
<img width="307" alt="Screenshot 2024-02-04 at 18 20 53" src="https://github.com/clairep94/oppo-games/assets/128436909/e370324c-ea16-44fa-9677-dda5e0e5d2f7">

- ✅ `spec/utils/TestHelpers.js`: Supportive functions for shorthand Jest testing. Eg. `expectNewToken`, `expectAuthError`, `expectError(code, message)`
- ✅ Battleships Backend with TTD
  - ✅ Adds TTD'd: Create, Index, FindByID, Join, Delete, Forfeit, SubmitShipPlacement & LaunchMissile
    - ✅ Error handling: Out-of-Turn, Awaiting-Opponent, Game-Already-Over, You-Are-Not-In-This-Game, Cannot-Delete-Ongoing-Game, Cannot-Join-Full-Game, Opponent-Not-Ready, Space-Already-Hit
  - ✅ Adds: Concealment supportive function
    - ✅ Opponents and game-observers get a concealed view that only shows HITs and MISSes on the game board & the full sank status of ships.
    - ✅ Opponents and game-observers DO NOT see remaining ship unit locations, remaining ship unit count or initial ship placements.
    - ✅ Concealment occurs in the backend to prevent cheating through inspecting the browser.

**Jan 28, 2024:**

- ✅ Frontend Test E2E coverage with Cypress
  - ✅ Landing Page
  - ✅ Signup Popup & Signup Page, Login Popup & Login Page
  - ✅ Game Intro Pages: TTT, Battleships, RPS

**Jan 21 2024:**

- ✅ Backend Test coverage with Jest

  - ✅ Added 10 test suites and 185 tests for Users, Messages, Authentication & Tictactoe
  - ✅ Tictactoe covers: Create, Index, FindbyID, Join, Delete, Forfeit & PlacePiece
    - ✅ Error handling: Out-of-Turn, Awaiting-Opponent, Game-Already-Over, You-Are-Not-In-This-Game, Already-A-Piece-There, Cannot-Delete-Ongoing-Game, Cannot-Join-Full-Game
    - ✅ TicTacToe game playthrough for 4 scenarios: X-Win, O-Win, Draw, Forfeit, 9th-Turn-Win

  <!---
  - Messaging in TicTacToe
  - TicTacToe game playthrough for 5 scenarios: X-Win, O-Win, Draw, Forfeit, 9th-Turn-Win, Leave-Mid-Game-And-Return
  - TicTacToe create, join, delete, forfeit & errors
  - Game Lobby
  - User Page
  - Users can see notifications of joins in real-time
  - Users can send and see game invitations
  - Users can play RPS & Battleships
  --->

<br>


</details>

## Screenshots

![Screenshot 2024-01-12 at 05 27 24](https://github.com/clairep94/fp_team6_battleships/assets/128436909/ef000121-91e2-40d4-a5ae-e8da95a4dca4)
![Screenshot 2024-01-12 at 05 27 34](https://github.com/clairep94/fp_team6_battleships/assets/128436909/7c1f3a23-fbeb-4e99-8214-46dae82ed911)

![Screenshot 2024-01-12 at 02 33 27](https://github.com/clairep94/fp_team6_battleships/assets/128436909/2bcdacd7-bb84-4a46-8f2e-48f1d63fce17)
![Screenshot 2024-01-12 at 02 39 48](https://github.com/clairep94/fp_team6_battleships/assets/128436909/bf185f59-b0ad-48ed-ab06-33cb96de69e6)
![Screenshot 2024-01-12 at 02 41 23](https://github.com/clairep94/fp_team6_battleships/assets/128436909/230d9fec-a425-4393-9c41-8f31ceefe6c4)

<br>

## Installation:

### Node.js

1. Install Node Version Manager (nvm)
   ```
   brew install nvm
   ```
   Then follow the instructions to update your `~/.bash_profile`.
2. Open a new terminal
3. Install the latest version of [Node.js](https://nodejs.org/en/), currently `18.1.0`.
   ```
   nvm install 18
   ```

### MongoDB

1. Install MongoDB
   ```
   brew tap mongodb/brew
   brew install mongodb-community@5.0
   ```
   _Note:_ If you see a message that says `If you need to have mongodb-community@5.0 first in your PATH, run:`, follow the instruction. Restart your terminal after this.
2. Start MongoDB
   ```
   brew services start mongodb-community@5.0
   ```

### Packages:

1. npm install in the three main folders:

   ```shell
   ; cd api
   ; npm install
   ; cd ../frontend
   ; npm install
   ; cd ../socket
   ; npm install
   ```

## Running the App

1. Start the server application (in the `api` directory)

   ```shell
   ; cd api
   ; JWT_SECRET=f6d278bb34e1d0e146a80b16ec254c05 npm start
   ```

2. Start the front end application (in the `frontend` directory)

In a new terminal session...

```shell
; cd frontend
; npm start
```

You should now be able to open your browser and go to `http://localhost:3000/`

3. Start the socket (in the `socket` directory)

   In a new terminal session...

```shell
; cd socket
; npm start
```

<br>

## Running the Tests

Currently, the project has test coverage for the API only via Jest. E2e frontend testing will be implemented in the future, please see future features list below.

1. Start the backend server in test mode. Leave this running for all testing.

```bash
# Make sure you're in the api directory
; cd api

; JWT_SECRET=f6d278bb34e1d0e146a80b16ec254c05 npm run start:test
```

2. Running the backend tests.

   In a new terminal session...

```bash
# Make sure you're in the api directory
; cd api

; JWT_SECRET=f6d278bb34e1d0e146a80b16ec254c05 npm run test
```

**Note: On first run of test suite, you must run the test twice before they pass. This is because the the test database is created and written during these initial test runs.**

3. Running the frontend tests.

   ** Cypress E2e to be implemented**

<!---
Reseting to commit on Feb 6th to bug-fix frontend
####  Running tests for the frontend

Start the front end in a new terminal session

```bash
# Make sure you're in the frontend directory
; cd frontend

; JWT_SECRET=f6d278bb34e1d0e146a80b16ec254c05 npm start
```

Then run the tests in a new terminal session

```bash
# Make sure you're in the frontend directory
; cd frontend

; JWT_SECRET=f6d278bb34e1d0e146a80b16ec254c05 npm run test
```
--->
