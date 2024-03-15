import React, { useEffect, useState } from 'react';
import GameTypeCard from './GameTypeCard';
import SingleGameCard from './SingleGameCard';
import AllGamesCard from './AllGamesCard';
import { gamesMenu } from '../games/gamesMenu';

const GamesLobby = ({ navigate, token, setToken, sessionUserID, sessionUser, setSessionUser }) => {

  // ======= GAME DATA ================
  const [allGames, setAllGames] = useState([]); // ---> USE FILTERING METHOD
  const [displayGames, setDisplayGames] = useState([]);
  const [viewTitle, setViewTitle] = useState("All"); // ---> Controls view of the games list: "All", "Open", "Your", "TTT", "RPS", "BS"
  const [loading, setLoading] = useState(true);
  // fix "YOUR "view

  // ============= GETTING ALL GAMES & SORTING BY ANTI-CHRONOLOGICAL ================= //
  const fetchAllGames = async () => {
    // Function to fetch all games in the gamesMenu
    // Iterate through gamesMenu and add the resulting games data to allGames
    // allGames is stored in the order of the GET requests, then in chronological order
    // displayGames is stored by default in a mixed, antichronological order

    try {
      const fetchedResults = [];
      for (const game of gamesMenu) {

        // PERFORM GET REQUEST FOR EACH GAME TYPE
        const response = await fetch(`/${game.endpoint}`, {
          headers: {'Authorization': `Bearer ${token}`}
        });

        // HANDLE ERROR IF ERROR
        if (!response.ok) {
          const errorMessage = await response.text(); // Get the error message from the response body
          throw new Error(`Failed to fetch data from ${game.endpoint}: ${response.statusText}. Error message: ${errorMessage}`);
        }
        const data = await response.json();
        fetchedResults.push(...data.games)
        window.localStorage.setItem("token", data.token)
        setToken(window.localStorage.getItem("token"))
      }

      setAllGames(fetchedResults);
      setDisplayGames(sortByRecent(fetchedResults));
      setLoading(false);
    } catch (error) {
      console.error(`Error fetching results:`, error);
    }
  };

  const sortByRecent = (games) => {
    return [...games].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  };


  // ============= USE EFFECT HOOK TO GETTING ALL GAMES ================= //
  useEffect(() => {
    if(token){
      fetchAllGames();
    } else {
      console.log("No token!")
    }
  }, [])

  // TODO Create game object, all functions below as methods
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
            }
          });
      
        if (response.status === 201) {
          const data = await response.json();
          const gameID = data.game._id;

          navigate(`/${game.endpoint}/${gameID}`);
          window.localStorage.setItem("token", data.token)
          setToken(window.localStorage.getItem("token"))
        } else {
          console.log("Error creating game:", response.error)
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
          window.localStorage.setItem("token", data.token)
          setToken(window.localStorage.getItem("token"))

        } else {
          console.log("Error joining game:", response.error)
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

          setAllGames(allGames.map(game => game._id === gameID ? data.game : game)) // update All Games with the new forfeit
          setDisplayGames(displayGames.map(game => game._id === gameID ? data.game : game)) // update Display Games with the new forfeit

          window.localStorage.setItem("token", data.token)
          setToken(window.localStorage.getItem("token"))

        } else {
          console.log("Error forfeiting game:", response.error)
        }
      } catch (error) {
        console.error(`Error forfeiting ${game.title} game:`, error);
      }
    }
  }


  // ============ DELETE GAME ============= //
  // Delete a game and stay on the same page with the updated data
  const deleteGame = async (game) => {
    console.log(`Delete ${game.title}`)
    if(token){
      try {
        const IDToDelete = game._id // store the ID to delete for render update after response.ok
        const response = await fetch (`/${game.endpoint}/${game._id}`, {
          method: 'delete',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 200) {
          const data = await response.json();

          setAllGames(allGames.filter(game => game._id !== IDToDelete)) // update All Games with the new delete
          setDisplayGames(displayGames.filter(game => game._id !== IDToDelete)) // update Display Games with the new delete

          window.localStorage.setItem("token", data.token)
          setToken(window.localStorage.getItem("token"))


        } else {
          console.log("Error deleting game:", response.error)
        }
      } catch (error) {
        console.error(`Error deleting ${game.title} game:`, error);
      }
    }
  }

  // ======= GAME LIST VIEW ==============    
  const showGames = (view) => { // Function that filters using the corresponding view
    setViewTitle(view)
    // fetch Games

    switch (view) {
      case "All":
        setDisplayGames(sortByRecent(allGames));
        break;

      case "Open":
        const openGames = allGames.filter(game => !game.playerTwo);
        setDisplayGames(sortByRecent(openGames));
        break;

      case "Your": // INDEX 
        const yourGames = allGames.filter(game => game.playerOne?._id === sessionUserID || game.playerTwo?._id === sessionUserID);
        setDisplayGames(sortByRecent(yourGames));
        break;

      case "Tic-Tac-Toe":
        const tttGames = allGames.filter(game => game.endpoint === 'tictactoe');
        setDisplayGames(sortByRecent(tttGames));
        break;

      case "Rock-Paper-Scissors":
        const rpsGames = allGames.filter(game => game.endpoint === 'rockpaperscissors');
        setDisplayGames(sortByRecent(rpsGames));
        break;

      case "Battleships":
        const bsGames = allGames.filter(game => game.endpoint === 'battleships');
        setDisplayGames(sortByRecent(bsGames));
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
                { loading ? (
                  <p className='ml-2 font-bold'>
                    LOADING GAMES...
                  </p>
                ):
                (<>
                  {displayGames.map((game => (
                    <SingleGameCard game={game} sessionUserID={sessionUserID} joinGame={joinGame} forfeitGame={forfeitGame} deleteGame={deleteGame}/>
                  )))}
                </>
                )}
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


