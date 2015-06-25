var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server) {
  io = socketio.listen(server);
  io.set('log level',1);

  io.sockets.on('connection', function(socket) {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

    joinRoom(socket, 'Lobby');

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
    text: nickNames[socket.id] + 'has joined' + room + '.'
  });

  var userInRoom = io.sockets.clients(room);

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

function handleNameChangeAttempts(socket, nickNames, namesUsed){
  socket.io('nameAttempt',function(name){
    if (name.indexOf('Guest')==0) {
      socket.emit('nameResult',{
        success: false,
        message: 'Names cannot begin with "Guest"'
      });
    } else {
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        nameUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];

        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.io]).emit('message', {
          text: previouseName + ' is now known as ' + name + '.'
        });
      }else {
        socket.emit('nameResult', {
          success: false,
          message: 'this name is already in use.'
        });
      }
    }
  });
}

function handleMessageBroadcasting(socket) {
  socket.on('message', function(message){
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ':' + message.text
    });
  });
}

function handleRoomJoining(socket) {
  socket.on('join', function(room){
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket,room.newRoom);
  });
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', function(){
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete nameUsed[nameIndex];
    delete nickNames[socket.id];
  })
}