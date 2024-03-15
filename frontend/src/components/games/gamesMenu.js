import RockPaperScissors from "../games/rockpaperscissors/RockPaperScissors";
import Battleships from "../games/battleships/Battleships";
import TicTacToe from "../games/tictactoe/TicTacToe";

export const gamesMenu = [
  // <------- LIST OF ENDPOINTS, TITLES, IMAGE SOURCES FOR EACH GAME!! --> USE TO MAP OVER THE CARDS
  {
    title: "Tic-Tac-Toe",
    endpoint: "tictactoe",
    hardCodePlayersOnline: "234",
    mapName: "Icy Alpines",
    imgSource: "/cards/TTT.jpg",
    bgImageSource: "TTT.jpg",
    component: TicTacToe,
  },
  {
    title: "Rock-Paper-Scissors",
    endpoint: "rockpaperscissors",
    hardCodePlayersOnline: "108",
    mapName: "Mellow Meadow",
    imgSource: "/cards/RPS.jpg",
    bgImageSource: "RPS.jpg",
    component: RockPaperScissors,
  },
  {
    title: "Battleships",
    endpoint: "battleships",
    hardCodePlayersOnline: "84",
    mapName: "Rocky River",
    imgSource: "/cards/BS2.jpg",
    bgImageSource: "BS2.jpg",
    component: Battleships,
  },
];
