var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var GameLoop = require('./gameloop');
var express = require('express');
var app = express();

var FRAME_RATE = 100;
var games = {};

app.use(express.static('public'));

function createGame(sessionId){
	games[sessionId] = {players: [], playerPositions: [],  ball: {x:0, y:0, dx:0, dy: 0}, loop: new GameLoop(100, sessionId, onFrame)};
}

function addPlayer(sessionId, socket){
	games[sessionId].players.push(socket);
}

function removePlayer(sessionId, playerId){
	for(var i=0; i<games[sessionId].players.length; i++){
		if(games[sessionId].players[i].playerId === playerId){
			games[sessionId].players[i].close();
			games[sessionId].players.splice(i, 1);
		}
		break;
	}
}

function onFrame(gameDataId, afl){
	var gameData = games[gameDataId];
	//TODO: frame logic
	
	for(var i=0; i<gameData.players.length; i++){
		console.log({playerPositions: gameData.playerPositions, ball: gameData.ball});
		gameData.players[i].send(JSON.stringify({type: 'frame', playerPositions: gameData.playerPositions, ball: gameData.ball}));
	}
}

var server = new WebSocketServer({port: 9001});
server.on('connection', function(socket){
	console.log('connected');
	
	socket.on('message', function(data){
		var payload = JSON.parse(data);
		console.log(payload);
		if(!socket.playerId && payload.user && payload.session){
			socket.playerId = payload.user;
			if(!games[(payload.session)]) createGame(payload.session);
			games[(payload.session)].players.push(socket);
			games[(payload.session)].playerPositions.push(0);
			games[(payload.session)].loop.begin();
		}
	});
	
});

app.listen(80);
