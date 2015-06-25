var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = ;
var namesUsed = [];
var currentRoom = ;

exports.listen = function(server) {
  io = socketio.listen(server);
  io.set('log level',1);

  io.sockets.on('connection', function(socket) {
    guestNumber = assignGuestName(socket, guestNumber, ?nickNames, namesUsed);

    joinRooom(socket, 'Lobby');

    handleMessageBroadcasting(socket, nickNames);

    handleNameChangeAttempts(socket, nickNames, namesUsed);

    handleRoomJoining(socket);

    socket.on('room', function(){
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    handleClientDisconnection(socket, nickNames, namesUsed);
  });
}

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  var name = 'Guest' + guestNumber;
  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  });

  namesUsed.push(name);

  return guestNumber + 1;
}

function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;

  socket.emit('joinResult',{room:room});
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + 'has joined' + room + '.';
  });

  var userInRoom = io.socket.clients(room);

  if (userInRoom.length > 1) {
    var userInRoomSummary = 'User currently in ' + room + '.';
    for (var i in userInRoom) {
      var userSocketID = userInRoom[i].id
      if (userSocketID != socket.id) {
        if (i > 0) {
          userInRoomSummary += ',';
        }
        userInRoomSummary += nickNames[userSocketID];
      }
    }
    userInRoomSummary += '.';
    socket.emit('message',{text: userInRoomSummary});
  }
}