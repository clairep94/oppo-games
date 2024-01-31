const Battleships = require("../models/battleships");
const TokenGenerator = require("../lib/token_generator");
// TODO ADD IN GAME CONTROLLER FOR WIN CONDITIONS
// TODO Add points for this game if there is a win condition

const BattleshipsController = {
  Index: (req, res) => {
    Battleships.find()
    .populate('playerOne', '_id username points') 
    .populate('playerTwo', '_id username points') 
    .populate('winner', '_id username points')
    .exec((err, battleshipsGames) => {
      if (err) {
        throw err;
      }
      const token = TokenGenerator.jsonwebtoken(req.user_id)
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.status(200).json({ games: battleshipsGames, token: token });
      // res.status(200).json({ games: battleshipsGames });

    });
  },
  
  FindByID: (req, res) => {
   const battleshipsID = req.params.id;
    const userID = req.user_id; // userID of the viewer

    // ========= 1) Find the game ====================
    Battleships.findById(battleshipsID)
    .populate('playerOne', '_id username points') 
    .populate('playerTwo', '_id username points') 
    .populate('winner', '_id username points')
    .exec((err, game) => {
      if (err) {
        throw err;
      }

      // ======== 2) Conceal the boards according to who is looking (playerOne, playerTwo, outsider) ============
        // If the viewer is NOT the owner of the board (ie. a spectator or the opponent), they will get a concealed version of the board
        // This concealed version checks for "s" and converts it to "".
        // This concealment occurs in the backend before the final game data is returned, rather than in the frontend display methods, so that players cannot cheat by inspecting the data.

      const concealBoard = (board) => {
      // Iterate over all spaces and change all spaces with "s" to ""
        for (let i = 0; i < board.length; i++) {
          for (let j = 0; j < board[i].length; j++) {
              if (board[i][j] === "s") {
                  board[i][j] = "";
              }
            }
          }
        return board;
      }

      // TODO check == or ===
      // Conceal playerOneBoard if viewer is not playerOne:
      if (userID !== playerOne._id){
        game.playerOneBoard = concealBoard(game.playerOneBoard);
      }
      // Conceal playerTwoBoard if viewer is not playerTwo:
      if (userID !== playerTwo._id){
        game.playerTwoBoard = concealBoard(game.playerTwoBoard);
      }

      const token = TokenGenerator.jsonwebtoken(req.user_id)
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.status(200).json({ game: game, token: token });
    });
  },

  Create: async (req, res) => {
    // const newBattleships = new Battleships({
    //   playerOne: req.body.playerOne,
    //   playerTwo: req.body.playerTwo 
    // });
    const userID = req.user_id;

    const newBattleships = new Battleships({
      playerOne: userID
    });

    try { 
      const result = await newBattleships.save()
      const populatedBattleships = await Battleships.populate(result, { path: 'playerOne', select: '_id username points' });
      await Battleships.populate(populatedBattleships, { path: 'playerTwo', select: '_id username points' });
      await Battleships.populate(populatedBattleships, { path: 'winner', select: '_id username points' });

      const token = TokenGenerator.jsonwebtoken(req.user_id)
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.status(201).json({ token: token, game: populatedBattleships });

    } catch (error) {
      console.log('Error in TTT.Create', error);
      res.status(501).json(error);
    }
  },


  Join: async (req, res) => {
    const gameID = req.params.id;
    const userID = req.user_id;
    
    try {
      const game = await Battleships.findById(gameID)
      .populate('playerOne', '_id username points') 
      .populate('playerTwo', '_id username points') 
      .populate('winner', '_id username points')

      if (game.playerTwo) {
        console.log("ERROR: GAME ALREADY FULL");
        const token = TokenGenerator.jsonwebtoken(req.user_id);

        return res.status(403).json({error: 'Game already full.', game: game, token: token})
      
      } else {
        const joinedGame = await Battleships.findOneAndUpdate( 
          { _id: gameID },
          {
            $set: { playerTwo : userID },
          },
          {new: true}
        )
        .populate('playerOne', '_id username points') 
        .populate('playerTwo', '_id username points') 
        .populate('winner', '_id username points')

        const token = TokenGenerator.jsonwebtoken(req.user_id);
        res.status(200).json({token: token, game: joinedGame});

      }
      
    } catch (error) {
      console.log('Error in TTT.Join', error);
      res.status(501).json(error);
      
    }
  },



  Forfeit: async (req, res) => {
    try {
      const sessionUser = req.user_id;
      // const sessionUser = req.body.user;  // postman testing purposes only
      const gameID = req.params.id;
      const game = await Battleships.findById(gameID)
        .populate('playerOne', '_id username points') 
        .populate('playerTwo', '_id username points') 
        .populate('winner', '_id username points');

      // Throw error if sessionUser is not in the game:
      if ((sessionUser != game.playerOne._id) && (sessionUser != game.playerTwo._id)){
        console.log("ERROR: NON-PARTICIPANTS CANNOT FORFEIT");
        const token = TokenGenerator.jsonwebtoken(req.user_id);
        return res.status(403).json({error: 'Only players can forfeit the game.', game: game, token: token}); //return the old game so as to not mess up the rendering
      }

      const winner = sessionUser == game.playerOne._id ? game.playerTwo._id : game.playerOne._id

      const forfeitedGame = await Battleships.findOneAndUpdate(
        { _id: gameID },
        {
          $push: {winner: winner},
          $set: {finished: true }
        },
        { new: true }
      )            
      .populate('playerOne', '_id username points') 
      .populate('playerTwo', '_id username points') 
      .populate('winner', '_id username points')

      const token = TokenGenerator.jsonwebtoken(req.user_id);
      res.status(200).json({token: token, game: forfeitedGame});
      // res.status(200).json({game: forfeitedGame});


    } catch (error) {
      console.error('Error forfeiting: ', error);
      res.status(500).json(error);
    }
  },



  Delete: async (req, res) => {
    try {
      const sessionUser = req.user_id;
      const gameID = req.params.id;
      const game = await Battleships.findById(gameID)
        .populate('playerOne', '_id username points') 
        .populate('playerTwo', '_id username points') 
        .populate('winner', '_id username points');

      const allGames = await Battleships.find()
        .populate('playerOne', '_id username points') 
        .populate('playerTwo', '_id username points') 
        .populate('winner', '_id username points')

      // Throw error if sessionUser is not playerOne (host)
      if ((sessionUser != game.playerOne._id)){
        console.log("ERROR: ONLY HOSTS CAN DELETE GAMES");
        return res.status(403).json({error: 'Only hosts can delete the game.', game: game, games: allGames}); //return the old game & games list so as to not mess up the rendering
      }
      // Throw error if game is full (has playerTwo):
      if (game.playerTwo){
        console.log("ERROR: CANNOT DELETE NON-OPEN GAMES");
        return res.status(403).json({error: 'Only games awaiting player Two can be deleted.', game: game, games: allGames}); //return the old game & games list so as to not mess up the rendering
      }

      // Delete the game
      await Battleships.findByIdAndDelete(gameID);

      // Get the updated game list
      const updatedGames = await Battleships.find()
        .populate('playerOne', '_id username points') 
        .populate('playerTwo', '_id username points') 
        .populate('winner', '_id username points')

      // Generate new token
      const token = TokenGenerator.jsonwebtoken(req.user_id);
      res.status(200).json({token: token, games: updatedGames});

    } catch (error) {
      console.error('Error deleting: ', error);
      res.status(500).json(error);
    }
  },



  // ===================== BATTLESHIP SPECIFIC GAMEPLAY METHODS ============================
  SubmitShipPlacements: async (req,res) => {
    const gameID = req.params.id;
    const userID = req.user_id;

    // Format of the placements payload will be a nested array with "C", "B" etc. corresponding to a 10x10 gameboard
    // TODO See line ___ for usage.
    const placements = req.body.placements; 

    try {

      // 1) =========== Find the current game and Catch Errors: =================
        // Users cannot submit ship placements if ships have already been placed --> all ship placements are submitted at once.
        // Users cannot submit incomplete ship placements
        // Users cannot submit placements if they are not in the game

      // 2) =========== Update the user's board with the ship placements: =================
        const shipCodeMap = {
          "C": "carrier",
          "B": "battleship",
          "R": "cruiser",
          "S": "submarine",
          "D": "destroyer"
        }
        // Iterate over each unit of the placements payload gameboard:
          // If the unit is not in shipCodeMap, skip
          // Else:
            // Update the units with {hit_status: false, units: [rowIndex, colIndex]}
            // Update the board space to "s"
          // Update the corresponding playerNumBoard with the changed placement board.
        
    } catch (error) {
      console.error('Error submitting ship placements: ', error);
      res.status(500).json(error);
    }
  },
  ResetShipPlacements: async(req,res) => {
    const gameID = req.params.id;
    const userID = req.user_id;

    try {
      // 1) =========== Find the current game and Catch Errors: =================
      const currentGame = Battleships.findById(gameID); // TODO not populated version.

        // Users cannot reset if the opponent has also submitted their ship placements

      // 2) =========== Reset the player's board: ====================
      if (userID === currentGame.playerOne) {

      } else if (userID === currentGame.playerTwo) {

      } else {
        // Users cannot reset if they are not in the game
      }


    } catch (error) {
      console.error('Error resetting ship placements: ', error);
      res.status(500).json(error);
    }
  },
  LaunchMissile: async (req, res) => {
    const gameID = req.params.id;
    const userID = req.user_id;
    const row = req.body.row; //index
    const col = req.body.col;  //index

    try {

      // 1) ============= Find the current game and Catch Errors: =================
        // 

      // 2) ============= Place the piece & get the updated game data ==================
      // 3) ============= Check for sank ships: ===========================
      // 4) ============= Check for wins: =============================

    } catch (error) {
      console.error('Error placing piece: ', error);
      res.status(500).json(error);
    }
  }


};

module.exports = BattleshipsController;
