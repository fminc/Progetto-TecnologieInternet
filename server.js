var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const path = require('path');
const bcrypt = require('bcrypt');


// Database setting

const mongoose = require('mongoose');
const mongoURI = 'mongodb://127.0.0.1:27017/users'; 
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.once('open', () => {
  console.log('Connected to MongoDB database');
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

userSchema.pre('save', function(next) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

const scoreSchema = new mongoose.Schema({
  username: { type: String, required: true },
  score: { type: Number, default: 0 },
});

const Score = mongoose.model('Score', scoreSchema);

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

////////////////////////////////////////////////////////////////////////////////

// Handle subscribe form 
app.post('/subscribe', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user already exists in the database
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists. Please choose a different username.' });
    }

    // Create a new instance of the User model with the provided data
    const newUser = new User({ username: username, password: password });
    // Save the new user to the database
    await newUser.save();

    // Add the new user to the scores collection with an initial score of 0
    const newScore = new Score({ username: username, score: 0 });
    await newScore.save();

    return res.status(201).json({ message: 'User subscribed successfully!' });
  } catch (error) {
    console.error('Error during subscription:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle login form
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  
  try {
    // Use the User model to find a user with the provided username
    const user = await User.findOne({ username: username });

    if (!user) {
      // If the user does not exist, send a message indicating they need to subscribe first
      return res.status(401).json({ message: 'You should subscribe first!' });
    }

    // Use the comparePassword method to compare the provided password with the hashed password
    const isMatch = await user.comparePassword(password);

    if (isMatch) {
      
      // If passwords match, a succesful message appear     
      return res.status(200).json({ message: 'Login successful!', username: user.username });
    } else {
      // If passwords don't match, send a message indicating incorrect password
      return res.status(401).json({ message: 'Your password is incorrect, please retry' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle the matchmaking request
app.post('/matchmaking', (req, res) => {
  res.status(200).send();
});
// Handle getting the ranking data
app.get('/getRanking', async (req, res) => {
  try {
    // Retrieve the top 10 scores from the scores collection, sorted in descending order
    const rankingData = await Score.find({}, 'username score').sort({ score: -1 }).limit(10);
    res.status(200).json(rankingData);
  } catch (error) {
    console.error('Error getting ranking data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/middle', (req, res) => {
  res.sendFile(__dirname + '/middle.html');
});

// Serve ranking.html for the ranking page
app.get('/ranking', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ranking.html'));
});

app.get('/favicon.ico', (req, res) => res.status(204));


const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle Socket connection request from client
const rooms = {};
let usernameArray = [];
let player1Score = 0;
let player2Score = 0;
let currentRound = 0;

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("createGame", (data) => {
    const roomUniqueId = makeid(6);
    usernameArray.push(data.playerUsername);
    console.log(data.playerUsername);
    rooms[roomUniqueId] = {};
    socket.join(roomUniqueId);
    socket.emit("newGame", { roomUniqueId: roomUniqueId });
  });

  socket.on("joinGame", (data) => {
    if (rooms[data.roomUniqueId] != null) {
      usernameArray.push(data.playerUsername);
      console.log(data.playerUsername);
      socket.join(data.roomUniqueId);
      socket.to(data.roomUniqueId).emit("playersConnected", {});
      socket.emit("playersConnected");
    }
  });

  socket.on("p1Choice", (data) => {
    console.log("P1choice", data);
    let rpsValue = data.rpsValue;
    if (rooms[data.roomUniqueId]) {
      rooms[data.roomUniqueId].p1Choice = rpsValue;
      console.log(rooms[data.roomUniqueId].p2Choice);
      if (rooms[data.roomUniqueId].p2Choice) {
        declareRoundWinner(data.roomUniqueId);
      }
    }
  });

  socket.on("p2Choice", (data) => {
    console.log("P2choice", data);
    let rpsValue = data.rpsValue;
    if (rooms[data.roomUniqueId]) {
      rooms[data.roomUniqueId].p2Choice = rpsValue;
      if (rooms[data.roomUniqueId].p1Choice) {
        declareRoundWinner(data.roomUniqueId);
      }
    }
  });
});

function determineRoundResult(p1Choice, p2Choice) {
  let winner = null;
  if (p1Choice === p2Choice) {
    winner = "d";
  } else if (p1Choice == "Paper") {
    if (p2Choice == "Scissor") {
      winner = "p2";
    } else {
      winner = "p1";
    }
  } else if (p1Choice == "Rock") {
    if (p2Choice == "Paper") {
      winner = "p2";
    } else {
      winner = "p1";
    }
  } else if (p1Choice == "Scissor") {
    if (p2Choice == "Rock") {
      winner = "p2";
    } else {
      winner = "p1";
    }
  }
  return winner;
}

async function declareRoundWinner(roomUniqueId) {
  console.log("declareRoundWinner");

  let p1Choice = rooms[roomUniqueId].p1Choice;
  let p2Choice = rooms[roomUniqueId].p2Choice;
  let roundResult = determineRoundResult(p1Choice, p2Choice);

  // Update scores based on round result
  if (roundResult === "p1") {
    player1Score++;
  } else if (roundResult === "p2") {
    player2Score++;
  }

  // Emit round result to clients
  io.sockets.to(roomUniqueId).emit("result", {
    winner: roundResult,
    player1Score: player1Score,
    player2Score: player2Score,
    p1Choice: p1Choice,
    p2Choice: p2Choice,
    player1Name: usernameArray[0],
    player2Name: usernameArray[1], 
  });
  console.log(`player1Name: ${usernameArray[0]}, player2Name: ${usernameArray[1]}`),
  rooms[roomUniqueId].p1Choice = undefined;
  rooms[roomUniqueId].p2Choice = undefined;

  if (player1Score === 3 || player2Score === 3) {
    const gameWinner = player1Score === 3 ? "p1" : "p2"; // Identify the actual winner
    let gameOverText = player1Score === 3 ? "You win!" : "Opponent wins!";
    io.sockets.to(roomUniqueId).emit("result", {
      winner: "gameOver",
      gameWinner: gameWinner,
      player1Score: player1Score,
      player2Score: player2Score,
      gameOverText: gameOverText,
      player1Name: usernameArray[0], 
      player2Name: usernameArray[1], 
    });

    // Update scores in the database
    try {
      await Score.updateOne({ username: usernameArray[0] }, { $inc: { score: player1Score } });
      console.log(usernameArray[0]);
      await Score.updateOne({ username: usernameArray[1] }, { $inc: { score: player2Score } });
      console.log(usernameArray[1]);
    } catch (error) {
      console.error('Error updating scores:', error);
    }
    
    // Reset scores for the next game
    player1Score = 0;
    player2Score = 0;
    usernameArray = [];
  }
  
  // Log the scores for debugging purposes
  console.log(`Player 1 Score: ${player1Score}`);
  console.log(`Player 2 Score: ${player2Score}`);
  console.log(`player1Name: ${usernameArray[0]}, player2Name: ${usernameArray[1]}`);
}

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
    