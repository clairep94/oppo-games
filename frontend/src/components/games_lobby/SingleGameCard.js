import React, { useState } from "react";

const SingleGameCard = (props) => {
  // This card shows a link to the individual game,
  // Displays the Game Title, ID, and Player One vs. Player Two or Player One awaiting opponent
  // Has a join button if the game is waiting an opponent and session user is not the host.
  // Has a delete button if the game is the session user's and is waiting for an opponent.
  // Has a forfeit button if the session user is in the game, and the game is not awaiting an opponent.

  const game = props.game;
  const sessionUserID = props.sessionUserID;
  const forfeitGame = props.forfeitGame;
  const joinGame = props.joinGame;
  const deleteGame = props.deleteGame;
  const [areYouSureForfeit, setAreYouSureForfeit] = useState(false);
  const [areYouSureDelete, setAreYouSureDelete] = useState(false);

  // ============ TAILWIND =====================
  // primary (join)
  const buttonStyle1 =
    "w-[12rem] text-md text-white font-semibold rounded-lg py-2 px-4 bg-pink-600/50 hover:bg-pink-600/70 focus:outline-none focus:shadow-outline-pink active:bg-pink-700/80";
  // secondary (delete/forfeit)
  const buttonStyle2 =
    "w-[12rem] text-md text-white font-semibold rounded-lg py-2 px-4 border-2 border-pink-600/50 hover:bg-pink-600/20 focus:outline-none focus:shadow-outline-pink active:bg-pink-700/80";

  // ========== BUTTONS ===================
  const JoinButton = () => (
    <button
      className={buttonStyle1}
      onClick={() => {
        joinGame(game);
      }}
    >
      Join Game
    </button>
  );

  const ForfeitButton = () => (
    <button
      className={buttonStyle2}
      onClick={() => {
        forfeitGame(game);
      }}
    >
      Forfeit Game
    </button>
  );

  const DeleteButton = () => (
    <button
      className={buttonStyle2}
      onClick={() => {
        deleteGame(game);
      }}
    >
      Delete Game
    </button>
  );

  // =========== JSX FOR UI OF COMPONENT =================
  if (game && game.playerOne) {
    return (
      <div className="bg-gray-700/30 rounded-lg w-full px-10 py-5 flex flex-row justify-between items-center">
        <a href={`/${game.endpoint}/${game._id}`}>
          <span className="font-bold text-lg">{game.title} </span>#
          {game._id.substring(18)}:
          {game.playerTwo
            ? ` ${game.playerOne.username} vs. ${game.playerTwo.username}`
            : ` ${game.playerOne.username} is awaiting an opponent`}
        </a>

        <div className="flex flex-row w-[12rem] justify-center">
          {game.playerOne?._id !== sessionUserID && !game.playerTwo && (
            <JoinButton />
          )}

          {game.playerOne?._id === sessionUserID && !game.playerTwo && (
            <DeleteButton />
          )}

          {game.winner.length > 0 &&
            (game.winner.length === 2
              ? "Draw"
              : `Winner: ${game.winner[0].username}`)}

          {game.playerOne &&
            game.playerTwo &&
            !game.finished &&
            (game.playerOne._id === sessionUserID ||
              game.playerTwo._id === sessionUserID) && <ForfeitButton />}
        </div>
      </div>
    );
  } else {
  }
};

export default SingleGameCard;

// join -> no game.playerTwo && game.playerOne is not sessionUserID
// delete -> no game.playerTwo && game.playerOne is sessionUserID
// forfeit -> (game.playerTwo && game.playerOne) &&
