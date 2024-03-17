import React, {useState, useRef, useEffect} from "react";
import BattleshipsSetUpShipyard from "./setup_stage_components/BattleshipsSetUpShipyard";
import BattleshipsSetupBoard from "./setup_stage_components/BattleshipsSetupBoard";
import BattleshipsSetupButtons from "./setup_stage_components/BattleshipsSetupButtons";

export default function BattleshipsSetUpGameboard({ game, sessionUserID, setErrorMessage, setGame, token, setToken, socket, gameID }) {

    // ================ GAME DATA & VIEW ======================
    // Is the sessionUser an observer
    const isObserver = (sessionUserID !== game.playerOne._id && sessionUserID !== game.playerTwo._id)

    // Find the sessionUser's ship submission
    const sessionUserPlayerStr = sessionUserID === game.playerOne._id ? "playerOne" : "playerTwo";
    const sessionUserPlacementsVar = sessionUserPlayerStr + "Placements"; 
    const sessionUserPlacements = game[sessionUserPlacementsVar]; // [] or nested array

    // Check if the sessionUser has already submitted placements:
    const alreadySubmitted = sessionUserPlacements.length !== 0;

    // Find the opponent's ship submission
    const opponentPlayerStr = sessionUserID === game.playerOne._id ? "playerTwo" : "playerOne";
    const opponentPlacementsVar = opponentPlayerStr + "Placements";
    const opponentPlacements = game[opponentPlacementsVar]; // [] or "submitted"

    // Check if the opponent has already submitted placements:
    const opponentSubmitted = opponentPlacements === "submitted"

    // ================= STATE VARIABLES =============================
    const emptyBoard =  Array.from({ length: 10 }, () =>
        Array.from({ length: 10 }, () => "")) // USE THIS TO RESET THE BOARD

    const resetShipYard = [
        {title: "carrier", placed: false, units: 5, code: "C" }, // 5 units
        {title: "battleship", placed: false, units: 4, code: "B" }, // 4 units
        {title: "cruiser", placed: false, units: 3, code: "R" }, // 3 units
        {title: "submarine", placed: false, units: 3, code: "U" }, // 3 units
        {title: "destroyer", placed: false, units: 2, code: "D" }, // 2 units
    ]
    
    // PLACING THE SHIPS
    const [placementBoard, setPlacementBoard] = useState(() => (
        Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ""))
    ));

    // STORES THE WORKING STATE OF THE PLACEMENT BOARD
    const [placementShipyard, setPlacementShipyard] = useState(resetShipYard); // STORES THE WORKING STATE OF THE SHIPYARD
    const [shipDirectionHorizontal, setShipDirectionHorizontal] = useState(true);
    const [currentShip, setCurrentShip] = useState(null);

    const TWUnitSize = 8 // TAILWIND UNITS

    // ================= FUNCTION FOR SUBMITTING SHIP PLACEMENTS =============================
    const submitPlacements = async () => {
        if (token) {
            try {
                const response = await fetch(`/${game.endpoint}/${game._id}/submit_placements`, {
                    method: 'put',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ placements: placementBoard }) // Send placementBoard instead of placementShipyard
                });

                const data = await response.json();
    
                if (response.status === 200) {
                    console.log("Data success", data)
                    const gameID = data.game._id;
                    const updatedGame = data.game;
    
                    setGame(updatedGame);
                    window.localStorage.setItem("token", data.token);
                    setToken(window.localStorage.getItem("token"));
                    const socketEventMessage =  `user ${sessionUserID} submitted their ships`
                    socket.current.emit("send-game-update", {gameID, updatedGame, socketEventMessage})
    
                } else {
                    console.log("Data error", data)
                    console.log("Error submitting placements:", data.error);
                    setErrorMessage(data.error);
    
                }
            } catch (error) {
                console.error(`Error submitting ${game.title} game:`, error);
            }
        }
    }
    
    // ========== PROPS DRILLING: ====================
    const commonProps = {
        setErrorMessage,
        TWUnitSize,
    }
    
    const shipyardProps = {
        ...commonProps,
        placementShipyard,
        setPlacementShipyard,
        shipDirectionHorizontal,
        currentShip,
        setCurrentShip,
    }
    
    const boardProps = {
        ...shipyardProps,
        placementBoard,
        setPlacementBoard,
    }
    const buttonProps = { // Keeping API calls & socket in the parent component.
        ...boardProps,
        resetShipYard,
        emptyBoard,
        submitPlacements,
        setShipDirectionHorizontal
    }

    
  // =================================== JSX FOR UI ==============================================================

  // --------------- OBSERVER VIEW ------------------
    if (isObserver) {
        return (
            <>
                {/* SHIP PLACEMENTS BOARD */}
                <div className="flex flex-col text-center justify-center bg-red-200/30 w-full h-full">
                    <p className="font-bold text-[2.2rem]">
                        Players are placing their ships ...
                    </p>
                    <p className="font-bold text-[1.5rem]">
                        {/* TODO figure out better comparison --> [["submitted"]] vs. [] */}
                        Player One: {game.playerOne.username} - {(game.playerOnePlacements.length === 0)? ("Not Ready"):("Ready")}
                    </p>
                    <p className="font-bold text-[1.5rem]">
                        {/* TODO figure out better comparison --> [["submitted"]] vs. [] */}
                        Player Two: {game.playerTwo.username} - {(game.playerTwoPlacements.length === 0)? ("Not Ready"):("Ready")}
                    </p>
                </div>
            </>
        )
    } 

    // ------------- ALREADY SUBMITTED SHIPS: ---------------------
    if (alreadySubmitted) {
        return(
            <>
                {/* SHIP PLACEMENTS BOARD */}
                <div className="flex flex-col text-center justify-center bg-red-200/30 w-full h-full">
                    <p className="font-bold text-[2rem]">
                        Ships submitted! 
                    </p>
                    <p className="font-bold text-[1.5rem]">
                        Opponent is placing their ships ...
                    </p>
                </div>
            </>
        )
    }

  // -------------- SESSIONUSER IS ONE OF THE PLAYERS --------------------
    return (
    <>
    {/* SHIP PLACEMENTS BOARD */}
    <div className="flex flex-row bg-red-200/30 w-full h-full">
                                
        {/* SHIPYARD */}
        <div className="flex flex-col w-full h-full">
            {/* SHIPYARD HEADER */}
            <h5 className="font-bold text-[2rem]">
            Your Shipyard
            </h5>
            {/* SETUP SHIPYARD */}
            <BattleshipsSetUpShipyard {...shipyardProps} />
        </div>

        {/* BOARD */}
        <div className="flex flex-col w-full h-full bg-green-50/10">
            <h5 className="font-bold text-[2rem]">
                Your Board
            </h5>

            {/* SETUP BOARD */}
            <BattleshipsSetupBoard {...boardProps}/>
        </div>
    </div>

    {/* SHIP PLACEMENTS BUTTONS */}
    <BattleshipsSetupButtons {...buttonProps}/>

    {/* OPPONENT HAS SUBMITTED ANNOUNCEMENT */}
    <div className="font-bold text-[1.5rem]">
        {!opponentSubmitted ? ("Opponent is placing their ships ..."):("Opponent has placed their ships!")}
    </div>
    </>
    )
}
