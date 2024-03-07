const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve the Audio Worklet processor file
app.use(express.static('function'));
app.use(express.static('webpage'));

// Store active channels and their users
const channels = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinChannel', (channel) => {
    socket.join(channel);
    if (!channels[channel]) {
      channels[channel] = [];
    }
    channels[channel].push(socket.id);
    io.to(channel).emit('userJoined', socket.id);
    io.to(socket.id).emit('channelUsers', channels[channel]);
  });

  socket.on('leaveChannel', (channel) => {
    socket.leave(channel);
    if (channels[channel]) {
      channels[channel] = channels[channel].filter((user) => user !== socket.id);
      io.to(channel).emit('userLeft', socket.id);
      io.to(socket.id).emit('channelUsers', channels[channel]);
    }
  });

  socket.on('audioStream', (data) => {
    // Broadcast audio to all users in the same channel except the sender
    socket.to(data.channel).emit('audioStream', { id: socket.id, audio: data.audio });
    // socket.emit('audioStream', { id: socket.id, audio: data.audio });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Remove the user from all channels
    Object.keys(channels).forEach((channel) => {
      channels[channel] = channels[channel].filter((user) => user !== socket.id);
      io.to(channel).emit('userLeft', socket.id);
    });
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
