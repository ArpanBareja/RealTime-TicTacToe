const socket = io();
let myTurn = true,
  symbol , clicks = 0 ;
let no_draw = true;
let buttonSel = document.querySelectorAll(".box");
let messageSel = document.querySelector("#message");
let loaderSel = document.querySelector("#loader");
let gameRegionSel = document.querySelector(".outer");
let resetSel = document.querySelector("#reset");

// disable button function
// true for disable , false for enable
function disableEnableBtn(val) {
  buttonSel.forEach((button) => {
    button.disabled = val;
  });
}

//Binding buttons on board
document.addEventListener("DOMContentLoaded", () => {
  //disbled all buttons and added an event listener to them
  buttonSel.forEach((button) => {
    button.disabled = true;
    button.addEventListener("click", makeMove);
  });
});

// whenever a pair joins the game
socket.on("game.begin", (data) => {
  loaderSel.style.display = "none";
  messageSel.style.height = "20vh";
  messageSel.style.fontSize = "20px";
  gameRegionSel.style.display = "flex";
  symbol = data.symbol;
  myTurn = symbol === "X";
  displayMessage();
});

// display message as per user/opponent turn's and disables, enables button
function displayMessage() {
  if (!myTurn) {
    messageSel.textContent = "Your Opponent's Turn";
    disableEnableBtn(true);
  } else {
    messageSel.textContent = "Your Turn";
    disableEnableBtn(false);
  }
}

// whenever button is clicked
function makeMove() {
  // if not my turn
  if (!myTurn) return;

  // if button is already having X or O
  if (this.textContent.trim().length) {
    return;
  }

  // emitting the symbol entered by player and btn id as obj
  clicks ++ ;
  socket.emit("make.move", {
    symbol: symbol,
    position: this.getAttribute("id"),
  });
}

// return an obj which stores symbol in that box
function getBoardState() {
  let obj = {};
  buttonSel.forEach((button) => {
    let buttonId = button.getAttribute("id");
    let buttonText = button.textContent || "";
    obj[buttonId] = buttonText;
  });
  return obj;
}

socket.on("draw", () => {
  resetSel.classList.remove("hide");
  messageSel.style.height = "80vh";
  messageSel.style.fontSize = "xx-large";
  messageSel.style.color = "#FFA603";
  messageSel.innerHTML = "Draw";
  console.log("Draw is to be displayed");
  no_draw = false;
  disableEnableBtn(true);
});

function isGameOver() {
  let state = getBoardState();
  let matches = ["XXX", "OOO"];

  // array storing state at all wining positions
  let arr = [
    state.a1 + state.a2 + state.a3,
    state.b1 + state.b2 + state.b3,
    state.c1 + state.c2 + state.c3,
    state.a1 + state.b1 + state.c1,
    state.a2 + state.b2 + state.c2,
    state.a3 + state.b3 + state.c3,
    state.a1 + state.b2 + state.c3,
    state.a3 + state.b2 + state.c1,
  ];

  // if any of the wining condition is fulfilled => gameover
  let is_gameOver = false;
  arr.forEach((line) => {
    if (line == matches[0] || line == matches[1]) {
      console.log("game over");
      is_gameOver = true;
    }
  });

  // return the number of board fille with characters X or O
  return is_gameOver;
}

// whenever move is made
socket.on("move.made", (data) => {
  document.getElementById(data.position).textContent = data.symbol;

  // if the symbol of the last move was the same as the current player
  // it means that now it's the opponent's turn
  socket.emit("draw" , clicks) ;
  myTurn = data.symbol !== symbol;
  if (!isGameOver()) {
    if (no_draw) displayMessage();
  } else {
    // else, showing win/lose message
    //console.log(numberOfClicks) ;
    resetSel.classList.remove("hide");
    messageSel.style.height = "80vh";
    messageSel.style.fontSize = "xx-large";

    if (myTurn) {
      console.log("changing heading");
      messageSel.style.color = "#940303";
      messageSel.innerHTML = "You lost.";
    } else {
      messageSel.style.color = "#07822c";
      messageSel.innerHTML = "You won!";
    }

    disableEnableBtn(true);
  }
});

// handling situation wher opp left
socket.on("opponent.left", () => {
  resetSel.classList.remove("hide");
  gameRegionSel.style.display = "none" ;
  messageSel.style.height = "80vh";
  messageSel.style.fontSize = "xx-large";
  console.log("hiding game area") ;
  messageSel.style.color = "white";
  messageSel.textContent = "Your opponent left the game";
});

// reset button
resetSel.addEventListener("click", () => {
  location.reload();
});
