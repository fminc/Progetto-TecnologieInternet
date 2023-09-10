const socket = io();
let roomUniqueId = null;
let player1 = false;
let currentRound = 1;
let player1Score = 0;
let player2Score = 0;
function createGame() {
  player1 = true;
  const playerUsername = localStorage.getItem("username");
  socket.emit("createGame", {playerUsername: playerUsername});
}

function joinGame() {
  const playerUsername = localStorage.getItem("username");
  roomUniqueId = document.getElementById("roomUniqueId").value;
  socket.emit("joinGame", { roomUniqueId: roomUniqueId, playerUsername: playerUsername });
}

socket.on("newGame", (data) => {
  roomUniqueId = data.roomUniqueId;
  document.getElementById("initial").style.display = "none";
  document.getElementById("gamePlay").style.display = "block";
  let waitingArea = document.getElementById("waitingArea");

  // Add waiting message
  document.getElementById(
    "waitingArea"
  ).innerHTML = `Waiting for opponent, please share code ${roomUniqueId} to join`;

  // Add copy button
  let copyButton = document.createElement("button");
  copyButton.classList.add("glow-on-hover");
  copyButton.innerText = "Copy Code";
  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(roomUniqueId).then(
      function () {
        console.log("Async: Copying to clipboard was successful!");
      },
      function (err) {
        console.error("Async: Could not copy text: ", err);
      }
    );
  });
  waitingArea.appendChild(copyButton);

  // Show the waiting area
  waitingArea.style.display = "block";
});

socket.on("playersConnected", () => {

  // Pause the current background music
  const backgroundMusic = document.getElementById("backgroundMusic");
  backgroundMusic.pause();

  const soundtracks = ["audio/soundtrack1.mp3", "audio/soundtrack2.mp3", "audio/soundtrack3.mp3"];

  // Randomly select a soundtrack
  const randomIndex = Math.floor(Math.random() * soundtracks.length);
  const randomSoundtrack = soundtracks[randomIndex];

  // Update the audio source and play
  backgroundMusic.src = randomSoundtrack;
  backgroundMusic.play();

  const enteringSound = document.getElementById("enteringSound");
  enteringSound.currentTime = 0; 
  enteringSound.play();

  document.getElementById("initial").style.display = "none";
  document.getElementById("waitingArea").style.display = "none";
  document.getElementById("gameArea").style.display = "flex";
});

socket.on("result", (data) => {
  console.log("result");
  let winnerText = "";
  if (data.winner != "d") {
    if (data.winner == "p1" && player1) {
      winnerText = "You win";
      setTimeout(() => {
        const winSound = document.getElementById("winSound");
        winSound.currentTime = 0;
        winSound.play();
        }, 1000);
    } else if (data.winner == "p1") {
      winnerText = "You lose";
      setTimeout(() => {
        const failureSound = document.getElementById("failureSound");
        failureSound.currentTime = 0;
        failureSound.play();
        }, 1000);
    } else if (data.winner == "p2" && !player1) {
      winnerText = "You win";
      setTimeout(() => {
        const winSound = document.getElementById("winSound");
        winSound.currentTime = 0; 
        winSound.play();
        }, 1000);
    } else if (data.winner == "p2") {
      winnerText = "You lose";
      setTimeout(() => {
        const failureSound = document.getElementById("failureSound");
        failureSound.currentTime = 0; 
        failureSound.play();
        }, 1000);
    }
  } else {
    winnerText = `It's a draw`;
    setTimeout(() => {
    const drawSound = document.getElementById("draw");
    drawSound.currentTime = 0; 
    drawSound.play();
    }, 1000);
  }
  $("#player2Choice").empty();

  let dest = "";
  if (!player1) {
    dest = "p1Choice";
  } else {
    dest = "p2Choice";
  }
  console.log(data);
  switch (data[dest]) {
    case "Rock":
      let $rock = $("<button/>", {
        id: "rockButton",
        class: "rock",
      });
      $("#player2Choice").append($rock);
      break;

    case "Scissor":
      let $scissor = $("<button/>", {
        id: "scissorButton",
        class: "scissor",
      });
      $("#player2Choice").append($scissor);
      break;

    case "Paper":
      let $paper = $("<button/>", {
        id: "paperButton",
        class: "paper",
      });
      $("#player2Choice").append($paper);

      break;
    default:
      let $tmp = $("<button/>", {
        id: "scissorButton",
        class: "scissor",
      });
      $("#player2Choice").append($tmp);
      break;
  }

  // Update the player scores
   player1Score = data.player1Score;
   player2Score = data.player2Score;

   // Update player names and scores
  $("#player1Score").text(`${data.player1Name}: ${data.player1Score}`);
  $("#player2Score").text(`${data.player2Name}: ${data.player2Score}`);

   $("#scoreBox").css("display", "block");

  
  setTimeout(() => {
    if (data.winner === "gameOver") {

      // Clear player's choice buttons
      $("#gamePlay").empty();
      $("#scoreBox").remove();
      
      const winnerTextElement = $("#winnerText");
    
      if (data.gameWinner === "p1" && player1) {
        winnerTextElement.text("Winner").addClass("winner-text").removeClass("loser-text");
        $(".animation-container").fadeIn();
          const winFanfare = document.getElementById("winFanfare");
          winFanfare.currentTime = 0; 
          winFanfare.play();
        setTimeout(() => {          
          const victorySound = document.getElementById("victorySound");
          victorySound.currentTime = 0;
          victorySound.play();
          }, 1000);
    } else if (data.gameWinner === "p2" && !player1) {
        winnerTextElement.text("Winner").addClass("winner-text").removeClass("loser-text");
        $(".animation-container").fadeIn();
        const winFanfare = document.getElementById("winFanfare");
        winFanfare.currentTime = 0; 
        winFanfare.play();
        setTimeout(() => {         
          const victorySound = document.getElementById("victorySound");
          victorySound.currentTime = 0; 
          victorySound.play();
          }, 1000);
    } else {
        winnerTextElement.text("You Lost!").addClass("loser-text").removeClass("winner-text");
        $(".animation-container").fadeIn();
        const lostFanfare = document.getElementById("lostFanfare");
        lostFanfare.currentTime = 0; 
        lostFanfare.play();
        setTimeout(() => {          
          const defeatSound = document.getElementById("defeatedSound");
          defeatSound.currentTime = 0; 
          defeatSound.play();
        }, 1000);
    }
  
      // Display the winner/loser text
      winnerTextElement.css("display", "block");

      setTimeout(function() {
        window.location.href = 'middle.html'; 
      }, 10000);
     

    } 
    else {
    $("#winnerArea").empty();
    $("#player2Choice").empty();
    $("#player1Choice").empty();
    var $rock = $("<button/>", {
      id: "rockButton",
      class: "rock",
      click: function () {
        sendChoice("Rock");
      },
    });
    $("#player1Choice").append($rock);

    var $paper = $("<button/>", {
      id: "paperButton",
      class: "paper",
      click: function () {
        sendChoice("Paper");
      },
    });
    $("#player1Choice").append($paper);

    var $scissor = $("<button/>", {
      id: "scissorButton",
      class: "scissor",
      click: function () {
        sendChoice("Scissor");
      },
    });
    $("#player1Choice").append($scissor);
  }
  }, 3000);
});

function sendChoice(rpsValue) {
 
  const choiceEvent = player1 ? "p1Choice" : "p2Choice";
  socket.emit(choiceEvent, {
    rpsValue: rpsValue,
    roomUniqueId: roomUniqueId,
  });

  const niceCallSound = document.getElementById("niceCall");
  niceCallSound.currentTime = 0; 
  niceCallSound.play();


  let playerChoiceButton = document.createElement("button");
  playerChoiceButton.style.display = "block";
  playerChoiceButton.classList.add(rpsValue.toString().toLowerCase());
  playerChoiceButton.innerText = rpsValue;

  $("#player1Choice").empty();
  $("#player1Choice").append(playerChoiceButton);
  
}




