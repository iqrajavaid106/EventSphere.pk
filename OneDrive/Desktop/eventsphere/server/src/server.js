require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./app');
const initSocket = require('./sockets/chatSocket');

const PORT = process.env.PORT || 5000;

const app = createApp();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*' },
});
initSocket(io);

httpServer.listen(PORT, () => {
  console.log(`EventSphere API listening on port ${PORT}`);
});
