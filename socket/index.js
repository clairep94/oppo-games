const io = require("socket.io")(8800, {
  // OPEN A THIRD PORT
  cors: {
    origin: "http://localhost:3000", //DO THIS ON THE REACT SERVER, NOT THE API SERVER (8080)
  },
});

let activeUsers = [];
let activeGames = {};

// ========== SOCKET METHODS:==============
io.on("connection", (socket) => {
  // Adding the session user to the list of active users:
  socket.on("add-new-user", (newUserID, gameID) => {
    //in param
    //if user is not added previously
    if (!activeUsers.some((user) => user.userID === newUserID)) {
      activeUsers.push({
        userID: newUserID,
        socketID: socket.id,
        gameID: gameID, //add gameID to params as well.
      });
    }

    //console log the connected users:
    console.log("Connected Users:", activeUsers);
    io.emit("get-users", activeUsers); // send to FE
  });

  // Disconnecting a user from the list of active users:
  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketID !== socket.id); //userID fed from socket.id from FE
    console.log("User Disconnected. Remaining Active Users:", activeUsers);
    io.emit("get-users", activeUsers); // send list of active users to the currently activeUsers
  });

  // When a user views a certain game
  socket.on("create-game-room", (gameID) => {
    console.log(gameID);
    const usersInGame = activeUsers.filter((user) => user.gameID === gameID);

    const game = {
      players: usersInGame,
    };

    socket.join(gameID);
    console.log("Game created:", game);
    console.log("All Games:", activeGames);

    // Optionally, you can store the game in your activeGames object
    activeGames[gameID] = game;
  });

  socket.on("send-game-update", ({ gameID, updatedGame, message = null }) => {
    if (activeGames[gameID]) {
      // check if activeGames[gameID] does not return null
      io.to(gameID).emit("receive-game-update", {
        gameID,
        gameState: updatedGame,
        message: message,
      });
      console.log("Updating Game:", gameID);
      console.log(message);
      console.log(updatedGame);
    } else {
      console.log("No active game found", gameID);
      console.log("Active Games: ", activeGames);
    }
  });

  socket.on("send-message", ({ gameID, sentMessage }) => {
    console.log("sending a message: ", gameID);
    if (activeGames[gameID]) {
      // check if activeGames[gameID] does not return null
      io.to(gameID).emit("receive-message", {
        gameID,
        receivedMessage: sentMessage,
      });
      console.log("Recieving message:", gameID);
      console.log(sentMessage);
    } else {
      console.log("No active game found", gameID);
      console.log("Active Games: ", activeGames);
    }

    // const {receiverID} = data;
    // const user = activeusers.find((user) => user.userID === socket.id);
    // if (user) {
    //     io.to(user.socketID).emit("recieve-message", data);
    // }
  });
});
