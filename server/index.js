const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);
const bodyParser = require("body-parser");
const fs = require("fs");

const port = process.env.PORT || 8888;
// unmatched will store socket.id
var players = {}, clients = {} ,
  unmatched = null;

// socket io
io.on("connection", (socket) => {
  console.log("New client conneted with user_socket.id: ", socket.id);
  clients[socket.id] = socket ;

  join(socket);

  // assigns values to players obj, which contains details of opponent, symbol, socket
  function join(socket) {
    players[socket.id] = {
      socket: socket,
      opponent: unmatched,
      symbol: "X",
    };

    // if player player is single
    if (unmatched == null) {
      unmatched = socket.id;
    }

    // if already one player exists in waiting room
    else {
      players[socket.id].symbol = "O";
      players[unmatched].opponent = socket.id;
      unmatched = null;
    }
  }

  // returns opponent's socket
  function opponentOf(socket) {
    if (players[socket.id].opponent == null) return;
    return players[players[socket.id].opponent].socket;
  }

  // if opponent exist emitting message to start the game
  if (opponentOf(socket)) {
    socket.emit("game.begin", {
      symbol: players[socket.id].symbol,
    });
    opponentOf(socket).emit("game.begin", {
      symbol: players[opponentOf(socket).id].symbol,
    });
  }

  // event: (player move) listening
  socket.on("make.move", (data) => {
    // sending signal to both players about the made move
    socket.emit("move.made", data);
    opponentOf(socket).emit("move.made", data);

    // socket.on("draw" , (clicks) => {
    //   opponentOf(socket).on("draw" , (oppClicks => {
    //     if( clicks + oppClicks == 9 ) {
    //       socket.emit("draw") ;
    //     }
    //   })) 
    // });
  });

  // client disconnetion
  socket.on("disconnect", () => {
    console.log("Disconnected Client socket.id: ", socket.id);
    if (opponentOf(socket)) opponentOf(socket).emit("opponent.left");
    socket.broadcast.emit("clientdisconnect", socket.id);
    delete clients[socket.id] ;
  });
});

// static resources
app.use(express.static(__dirname + "/../client/"));

// home page
app.get("/", (req, res) => {
  const stream = fs.createReadStream(__dirname + "/../client/index.html");
  stream.pipe(res);
});

server.listen(port, () => {
  console.log(`Server listening at ${port} port`);
});
