const BattleshipsGame = require("../models/battleships-game");
const TokenGenerator = require("../lib/token_generator");
const {
  RESPONSE_CODES, getNewGame, handleGameAction, makeGameSnapshot
} = require("../lib/game-logic/battleships");

const BattleshipsGamesController = {

  Index: (req, res) => {
    const clientUserId = req.user_id;
    const token = TokenGenerator.jsonwebtoken(clientUserId);
    BattleshipsGame.find()
    // The following line uses mongoose's "field name syntax" to select specific fields for the populated documents.
    // This avoids the issue with using .populate when the child schema is updated; 
    // so this converts (e.g.) { players: [hostId] } to { players: [{ _id: hostId, username: "the-host" }] }
    .populate('players', 'username')
    // DO NOT POPULATE `hostId` - the host's username will already be in the `players` array,
    // and during the AWAITING_HOST state the hostId property will be null.
    .exec((err, games) => {
      if (err) {
        res.status(500).json({ error: err, token: token });
      } else {
        // Use `makeGameSnapshot` to redact any data the client isn't allowed to know.
        const gameSnapshots = games.map((game) => makeGameSnapshot(game, clientUserId));
        res.status(200).json({ games: gameSnapshots, token: token });
      }
    });
  },

  FindById: (req, res) => {
    const clientUserId = req.user_id;
    const token = TokenGenerator.jsonwebtoken(clientUserId);
    const gameId = req.params.id;
    BattleshipsGame.findById(gameId)
    // See above for what this .populate function call does
    .populate('players', 'username')
    .exec((err, game) => {
      if (err) {
        res.status(500).json({ error: err, token: token });
      } else {
        // `findById` returns `null` if there is no document with the matching id.
        if (game === null) {
          res.status(204).json({ token: token }); // 204 No Content
        } else {
          // Use `makeGameSnapshot` to redact any data the client isn't allowed to know.
          const gameSnapshot = makeGameSnapshot(game, clientUserId);
          res.status(200).json({ game: gameSnapshot, token: token });
        }
      }
    });
  },

  Create: (req, res) => {
    const clientUserId = req.user_id;
    const token = TokenGenerator.jsonwebtoken(clientUserId);
    // Require the `shouldJoin` property to be present in the request body.
    const shouldJoin = req.body.shouldJoin;
    if (shouldJoin === undefined) {
      const msg = "You must provide a `shouldJoin` property in the request body";
      res.status(400).json({ message: msg, token: token });
      return;
    }
    // `getNewGame` also handles timestamps
    let game = new BattleshipsGame(getNewGame());
    if (shouldJoin) {
      const result = handleGameAction(game, { op: "join", args: { }, playerId: clientUserId });
      // Response code should always be OK here
      if (result.response.code !== RESPONSE_CODES.OK) {
        console.log(result);
        throw new Error("MAJOR PROBLEM: handleGameAction rejected a host join action!");
      }
      game = result.game;
    }
    game.save((err, game) => {
      if (err) {
        res.status(500).json({ error: err, token: token });
      } else {
        // Respond with the id of the new game.
        res.status(201).json({ message: 'OK', token: token, gameId: game.id });
      }
    });
  },

  DoGameAction: (req, res) => {
    const clientUserId = req.user_id;
    const token = TokenGenerator.jsonwebtoken(clientUserId);
    // Get the game id, operation, and arguments
    const gameId = req.params.id;
    const operation = req.params.op;
/* EXPERIMENT: DISABLING for Battleships to make API caller *have* to pass in req body
    const operationArgs = (
      (req.body.args === undefined)
      ? { } // Always pass in an object to handleGameAction, even an empty one
      : req.body.args
    );
*/
    if (req.body.args === undefined) {
      res.status(400).json({ message: "Must provide `args` in request body" });
    }
    // First DB access: Find the game
    BattleshipsGame.findById(req.params.id)
    /*.populate('players', 'username')*/ // DO NOT USE with `handleGameAction`!
    .exec((err, game) => {
      if (err) {
        res.status(500).json({ error: err, token: token });
      } else {
        // Use a game logic function to process the action request
        const result = handleGameAction(game, {
          op: operation, args: operationArgs, playerId: clientUserId,
        });
        // Use the result response code to determine next steps
        if (result.response.code === RESPONSE_CODES.OK) {
          // The action was successful.
          // Second DB access: Overwrite the game with the updated version.
          result.game.save()
          .then((_) => {
            // Third DB access [ouch - we only need to do this in order to have
            // access to .populate()]:
            BattleshipsGame.findById(req.params.id)
            .populate('players', 'username')
            .exec((err, updatedGame) => {
              if (err) {
                res.status(500).json({ error: err, token: token });
              } else {
                // Respond with a game snapshot
                const updatedGameSnapshot = makeGameSnapshot(updatedGame, clientUserId);
                res.status(200).json({ message: 'OK', game: updatedGameSnapshot, token: token });
              }
            });
          });
        } else if (result.response.code === RESPONSE_CODES.INVALID) {
          // The action was rejected (for instance, trying to make a move out-of-turn).
          res.status(409).json({ message: 'REJECTED', error: result.response.error, token: token }); // 409 Conflict
        } else if (result.response.code === RESPONSE_CODES.UNKNOWN_TOKEN) {
          // The action was incomprehensible (e.g. misspelled op in endpoint URL).
          res.status(404).json({ message: 'NOT_FOUND', error: result.response.error, token: token}); // 404 Not Found
        } else {
          // Response code unknown ==> That's an Internal Server Error
          const msg = `Unrecognised game logic response code: ${result.response.code}`;
          res.status(500).json({ error: new Error(msg), token: token });
        }
      }
    });

  },

  //Delete: (req, res) => {},

};

module.exports = BattleshipsGamesController;
