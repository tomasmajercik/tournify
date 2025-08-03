// Importing required libraries
const express = require('express')
const path = require('path');
const bodyParser = require('body-parser')
const app = express()
const port = 3000

const http = require('http');
const socketIo = require('socket.io');

const sendPushNotification = require('./pushNotification');

require('./scheduler')

//********** WebSockets ************/ 
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // or specific mobile URL
  }
});
app.set('io', io);
io.on('connection', (socket) => {
  console.log('Client connected via WebSocket');

  socket.on('join_room', (room) => {
    console.log(`Socket joined room: ${room}`);
    socket.join(room);
  });
});

//********** WebSockets ************/ 

// Import the multer configuration for file handling
const upload = require('./multerConfig'); 

const checkUserIdentity = require('./middleware/checkUserIdentity')
const verifyToken = require('./middleware/authMiddleware');
const checkUserIdentityTournament = require('./middleware/checkUserIdentityTournament');

// Import other modules
const dbUser = require('./userQueries')
const dbTournament = require('./tournamentQueries')
const dbCategories = require('./sportCategoryQueries')
const dbAuth = require('./authQueries')

// Import Swagger and setup
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

// Middleware that parses incoming requests with JSON payloads
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

// Swagger definition
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Tournify API',
      version: '1.0.0',
      description: 'API for managing tournaments and users',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['*.js'], 
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
// Serve Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Default route
app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})


const fs = require('fs');
const sharp = require('sharp');

const serveImageWithGrayscale = (dirPath) => async (req, res) => {
  const filePath = path.join(__dirname, dirPath, req.params.filename);
  const grayscale = req.query.grayscale === 'true';

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Image not found');
  }

  try {
    const image = sharp(filePath);

    if (grayscale) {
      res.set('Content-Type', 'image/jpeg'); // you can enhance this to detect actual type
      return image.grayscale().toBuffer().then((data) => res.send(data));
    } else {
      return res.sendFile(filePath);
    }

  } catch (err) {
    console.error(err);
    return res.status(500).send('Failed to process image');
  }
};

app.get('/category/images/:filename', serveImageWithGrayscale('categoryImages'));
app.get('/uploads/:filename', serveImageWithGrayscale('uploads/images'));
app.post('/tournaments/:id/notify-start', verifyToken, dbTournament.sendTournamentStartNotifications);

//// ## GETs ##
// Users
app.get('/users', verifyToken, dbUser.getUsers);
app.get('/users/:id/info', verifyToken, checkUserIdentity, dbUser.getUserInfo);
app.get('/users/:id/tournaments', verifyToken, checkUserIdentity, dbUser.getUsersTournaments);
app.get('/users/:id/tournaments/history', verifyToken, checkUserIdentity, dbUser.getUsersTournamentsHistory);
app.get('/users/:id/tournaments/owned', verifyToken, checkUserIdentity, dbUser.getUsersOwnedTournaments);
app.get('/users/:id/top-picks', dbUser.getTopPicks);
app.get('/users/:id/tickets', verifyToken, checkUserIdentity, dbUser.getUserTickets);
app.get('/users/:id/tickets/:ticket_id/qr', verifyToken, checkUserIdentity, dbUser.getTicketQR);
// Tournaments
app.get('/tournaments', dbTournament.getTournaments);
app.get('/tournaments/:id/info', dbTournament.getTournamentInfo);
app.get('/tournaments/:id/leaderboard', dbTournament.getLeaderboardByTournament);
app.get('/tournaments/:id/enrolled', dbTournament.getEnrolledTeams);
app.get('/tournaments/categories', dbCategories.getAllCategories);
app.get('/tournaments/:id/teams/count', dbTournament.getTeamCount);

//// ## POSTs ##
// Users
app.post('/auth/register', upload.single('image'), dbAuth.insertUser);
app.post('/auth/login', dbAuth.login); 
app.post('/users/check-email', dbUser.checkEmailExists);
//Tournaments
app.post('/tournaments', verifyToken, dbTournament.createTournament);
app.post('/tournaments/:id/register', verifyToken, dbTournament.addTeamToTournament);
app.post('/tournaments/:id/join_team', verifyToken, dbTournament.joinTeamAtTournament);
app.post('/tournaments/leaderboard/add', verifyToken, dbTournament.addRecordToLeaderboard);
app.post('/tournaments/:id/check-tickets', verifyToken, dbTournament.checkTickets);

//// ## PUTs ##
// Users
app.put('/users/changePassword', verifyToken, dbUser.changePassword);
app.put('/users/editProfile', verifyToken, dbUser.editProfile);
app.put('/users/editPreferences', verifyToken, dbUser.editPreferences);
// Tournaments
app.put('/tournaments/:id/edit', verifyToken, checkUserIdentityTournament, dbTournament.editTournament);
app.put('/tournaments/:id/start', verifyToken, checkUserIdentityTournament, dbTournament.startTournament);
app.put('/tournaments/:id/stop', verifyToken, checkUserIdentityTournament, dbTournament.stopTournament);

//// ## DELETEs ##
app.delete('/tournaments/leaderboard/remove', verifyToken, dbTournament.removeFromLeaderboard);

// Start the server and listen on specified port
server.listen(port, () => {
  console.log(`App running on port ${port}. Have fun.`)
})
