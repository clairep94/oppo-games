import React, { useContext, useEffect, useState } from 'react';
import GameTypeCard from './GameTypeCard';
import SingleGameCard from './SingleGameCard';
import AllGamesCard from './AllGamesCard';
import { SessionContext } from '../app/ProtectedRoutes';
import { useNavigate } from 'react-router';

const GamesLobby = (props) => {
  const navigate = useNavigate();
  const {token, setToken, sessionUserID, sessionUser } = useContext(SessionContext);


  // ======= GAME DATA ================
  const [allGames, setAllGames] = useState([]); // ---> USE FILTERING METHOD
  const [displayGames, setDisplayGames] = useState([]);
  const [viewTitle, setViewTitle] = useState("All"); // ---> Controls view of the games list: "All", "Open", "Your", "TTT", "RPS", "BS"


  const gamesMenu = [ // <------- LIST OF ENDPOINTS, TITLES, IMAGE SOURCES FOR EACH GAME!! --> USE TO MAP OVER THE CARDS
    {
      title:'Tic-Tac-Toe', 
      endpoint: 'tictactoe',
      hardCodePlayersOnline: "234",
      mapName: "Icy Alpines",
      imgSource: '/cards/TTT.jpg'
    },
    {
      title:'Rock-Paper-Scissors', 
      endpoint: 'rps',
      hardCodePlayersOnline: "108",
      mapName: "Mellow Meadow",
      imgSource: '/cards/RPS.jpg'
    },
    {
      title: 'Battleships', 
      endpoint: 'battleships',
      hardCodePlayersOnline: "84",
      mapName: "Rocky River",
      imgSource: '/cards/BS2.jpg'
    }
  ] 

  // ============= GETTING ALL GAMES ================= //
  useEffect(() => {
    if(token) {
      fetch("/tictactoe", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => response.json())
        .then(async data => {
          window.localStorage.setItem("token", data.token)
          setToken(window.localStorage.getItem("token"))
          setAllGames(data.games);
          setDisplayGames(data.games);
        })
    }
  }, [])


  // =========== CREATING A GAME =================== //
  // add new game to allGames
  const createGame = async (game) => {
    console.log(`Create ${game.title}`)
    if(token) {
      try {
        const response = await fetch(`/${game.endpoint}`, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            } // @Perran, I don't use body with my create method, please amend conditionally accordingly
            });
        
            if (response.status === 201) {
            const data = await response.json();
            const gameID = data.game._id;
            setAllGames([...allGames, data.game])

            navigate(`/${game.endpoint}/${gameID}`);

            } else {
            console.log("error creating game")
            }
      } catch (error) {
        console.error(`Error creating new ${game.title} game:`, error);
      }
    }
  }

  // ============ JOINING A GAME ================== // 
  // join a game and re-direct to the unique game's page
  const joinGame = async (game) => {
    console.log(`Join ${game.title}`)
    console.log(game._id)
    console.log(game.endpoint)
    if(token){
      try {
        const response = await fetch (`/${game.endpoint}/${game._id}/join`, {
          method: 'put',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 200) {
          const data = await response.json();
          const gameID = data.game._id;

          navigate(`/${game.endpoint}/${gameID}`);
        } else {
          console.log("Error joining game")
        }
      } catch (error) {
        console.error(`Error joining ${game.title} game:`, error);
      }
    }
  }

  // ============ FORFEIT A GAME ================= //
  // forfeit a game and stay on the same page with the updated data.
  const forfeitGame = async (game) => {
    console.log(`Forfeit ${game.title}`)
    if(token){
      try {
        const response = await fetch (`/${game.endpoint}/${game._id}/forfeit`, {
          method: 'put',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 200) {
          const data = await response.json();
          const gameID = data.game._id;

          setAllGames(allGames.map(game => game._id === gameID ? game : data.game)) // update All Games with the new forfeit
          setDisplayGames(displayGames.map(game => game._id === gameID ? game : data.game)) // update Display Games with the new forfeit

        } else {
          console.log("Error joining game")
        }
      } catch (error) {
        console.error(`Error joining ${game.title} game:`, error);
      }
    }
  }


  // ============ DELETE GAME ============= //
  // Delete a game and stay on the same page with the updated data
  const deleteGame = async (game) => {
    // TODO have not written this yet for any games --> Just update page view for demo
    setAllGames(allGames.filter(el => el._id !== game._id)) // update All Games with the new forfeit
    setDisplayGames(displayGames.filter(el => el._id !== game._id)) // update Display Games with the new forfeit
  }


  // ======= GAME LIST VIEW ==============    

  const showGames = (view) => { // Function that filters using the corresponding view
    setViewTitle(view)
    // fetch Games

    switch (view) {
      case "All":
        setDisplayGames(allGames);
        break;

      case "Open":
        const openGames = allGames.filter(game => !game.playerTwo);
        setDisplayGames(openGames);
        break;

      case "Your":
        const yourGames = allGames.filter(game => game.playerOne._id === sessionUserID || game.playerTwo._id === sessionUserID);
        setDisplayGames(yourGames);
        break;

      case "Tic-Tac-Toe":
        const tttGames = allGames.filter(game => game.endpoint === 'tictactoe');
        setDisplayGames(tttGames);
        break;

      case "Rock-Paper-Scissors":
        const rpsGames = allGames.filter(game => game.endpoint === 'rps');
        setDisplayGames(rpsGames);
        break;

      case "Battleships":
        const bsGames = allGames.filter(game => game.endpoint === 'battleships');
        setDisplayGames(bsGames);
        break;

      default:
        console.log("Invalid view");
        // Code for handling an invalid view
    }
};





  // =========== TAILWIND ==============
  const frostedGlass = ` bg-gradient-to-r from-gray-300/30 via-purple-100/20 to-purple-900/20 backdrop-blur-sm
  shadow-lg shadow-[#363b54] border-[3px] border-white/10
  `
  const headerContainer = 'flex flex-row w-full h-[8rem] rounded-[1.5rem] p-10 pl-[10rem] justify-right'


  // ============== JSX FOR UI ========================

    if(token) {
      return(
        // BACKGROUND
        <div
            className=" flex flex-row items-center justify-center pl-[10rem] pr-[2rem] py-[1rem]"
            style={{ backgroundImage: 'url(/backgrounds/Welcome2.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center', height: '100vh' }}>

          {/* PAGE CONTAINER */}
          <div className='flex flex-col w-full h-full justify-between'>

            {/* HEADER */}
            <div className={headerContainer + frostedGlass + 'justify-between items-center'}>
              {/* HEADER GREETING */}
              <div className='flex flex-col space-y-5'>
                <h3 className='text-5xl text-white font-extrabold'>
                  Welcome back, {sessionUser?.username}
                </h3>
              </div>
            </div>

            
            {/* PAGE BOTTOM SECTION */}
            <div className='flex flex-col h-[50%] justify-between space-y-2'>
              
              <h3 className='text-4xl text-white font-extrabold'>Our Games</h3>

              {/* OUR GAMES - GAME CARDS WHERE YOU CAN SELECT TO CREATE A GAME OR VIEW OPEN GAMES OR VIEW CURRENT GAMES*/}
              <div className='flex flex-row bg-gray-600/40 rounded-[1rem] h-[60%] overflow-x-scroll pt-3 pl-2 pr-2 pb-6 border-2 space-x-3 border-white/20'>

                  {/* ALL GAMES CARD */}
                  <AllGamesCard showGames={showGames}/>

                  {gamesMenu.map((game, index) => (
                      <GameTypeCard game={game} index={index} showGames={showGames} createGame={createGame}/>
                  ))}

              </div>

              {/* LIST OF GAMES DEPENDING ON THE VIEW */}
              <h3 className='text-3xl text-white font-extrabold'>
                {viewTitle}{' '}Games
              </h3>
              
              {/* GAMES LIST - Show only unfinished games in the lobby */}
              <div className='flex flex-col bg-gray-600/40 rounded-[1rem] h-[40%] overflow-y-auto pt-3 pl-2 pr-2 pb-6 border-2 space-y-1 border-white/20'>
                {displayGames.map((game => (
                  <SingleGameCard game={game} sessionUserID={sessionUserID} joinGame={joinGame} forfeitGame={forfeitGame} deleteGame={deleteGame}/>
                )))}
              </div>
          </div>



          </div>
        </div>
      )
    } else {
      navigate('/login')
    }
}




export default GamesLobby;


