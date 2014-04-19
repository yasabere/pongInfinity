var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var GameLoop = require('./gameloop');
var express = require('express');
var path = require('path');
var app = express();
var md5 = require('MD5');

var FRAME_RATE = 100;
var games = {};

app.use(express.static('public'));
app.set('view engine', 'html');

var session = function(sessionId) {
	if (!games[sessionId]) games[sessionId] = {players:[], ball: {x:0, y:0, dx:0, dy:0}};
	return games[sessionId];
};
var killSession = function(sessionId) {
	delete games[sessionId];
};

//for testing opnly
app.get('/pong',function(req, res){
	res.sendfile(path.join('public','pages','desktop.html'));
});

app.get('/', function(req, res){
	var session = md5('session' + Date.now() + Math.random());
	var user = md5('user' + Date.now() + Math.random());
	games[session] = {players:[], ball: {x:0, y:0, dx:0, dy:0}};
	res.redirect('/' + session + '/' + user);
});

app.get('/:session', function(req, res){
	var user = md5('user' + Date.now() + Math.random());
	if (games[session]) games[session] = {players:[], ball: {x:0, y:0, dx:0, dy:0}};
	res.redirect('/' + req.param('session') + '/' + user);
});

app.get('/:session/:user', function(req, res){
	res.sendfile(path.join('public','pages','desktop.html'));
});

var server = new WebSocketServer({port: 9001});
server.on('connection', function(socket){
	var sessionId;
	console.log('connected');
	socket.on('message', function(data){
		var payload = JSON.parse(data);
		if (!sessionId) sessionId = payload.session;
		console.log('payload', data);
		if(!socket.playerId && payload.user && session){
			socket.playerId = payload.user;
			session(sessionId).players.push(socket);
			var numPlayers = session(sessionId).players.length;
			socket.playerSize = 360.0 / numPlayers;
			socket.paddlePosition = socket.playerSize / 2.0;
			var multiplier = ((360.0 - socket.playerSize) / 360.0);
			var stateArray = [];
			for(var i=0; i<numPlayers; i++){
				if (i !== (numPlayers - 1)) {
					session(sessionId).players[i].playerSize *= multiplier;
					session(sessionId).players[i].paddlePosition *= multiplier;
				}
				stateArray.push({size: session(sessionId).players[i].playerSize, paddlePosition: session(sessionId).players[i].paddlePosition, id: session(sessionId).players[i].playerId});
			}
			socket.send(JSON.stringify({type: 'init', state: stateArray, resumeTime: Date.now() + 4000}));
			var beginObj = {type: 'newPlayer',  numPlayers: numPlayers, playerId: socket.playerId, resumeTime: Date.now() + 4000};
			for(var i=0; i < numPlayers - 1; i++){
				session(sessionId).players[i].send(JSON.stringify(beginObj));
			}
		}else if(payload.type === 'score'){
			if (!payload.winner) console.log('winner was null');
			if (!payload.loser) console.log('loser was null');
			if (!payload.winner || !payload.loser) return;
			var winner, loser;
			session(sessionId).players.forEach(function(player) {
				if (player.playerId === payload.winner) winner = player;
				if (player.playerId === payload.loser) loser = player;
				if (winner && loser) {
					winner.size += 4; 
					winner.score += 1;
					loser.size -= 4;
				}
				if (player !== socket) player.send(data);
			});
		} else if (payload.type === 'paddle') {
		}
	});
	
	socket.on('close', function(){
		console.log('closed');
		var index = session(sessionId).players.indexOf(socket);
		var vacantSpace = session(sessionId).players[index].size;
		session(sessionId).players.splice(index, 1);
		var numPlayers = session(sessionId).players.length;
		var multiplier = (360.0 / (360.0 - vacantSpace));
		if (numPlayers > 0) {
			var endObj = JSON.stringify({type: 'playerLeave', playerIndex: index, numPlayers: numPlayers, resumeTime: Date.now() + 4000});
			for(var i=0; i<numPlayers; i++){
				session(sessionId).players[i].playerSize *= multiplier;
				session(sessionId).players[i].paddlePosition *= multiplier;
				session(sessionId).players[i].send(endObj);
			}
		} else {
			killSession(sessionId);
		}
	});
});