var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var GameLoop = require('./gameloop');
var express = require('express');
var path = require('path');
var app = express();
var md5 = require('MD5');

var FRAME_LENGTH = 50;
var GAME_RADIUS = 375;
var INITIAL_VELOCITY = 0.1;
var games = {};

app.use(express.static('public'));
app.set('view engine', 'html');

var session = function(sessionId) {
  	if (!sessionId) throw 'Session id was undefined';
  	if (typeof sessionId !== 'string') throw new Error('Session id "' + sessionId + '" was not a string');
  
    if (!games[sessionId]) { 
      var theta = Math.PI * 2 * Math.random();
      games[sessionId] = {
          players:[], 
          lastHit: -1,
          ball: { x:0, y:0, dx: /*(INITIAL_VELOCITY * Math.cos(theta))*/ 0.15, dy: /* (INITIAL_VELOCITY * Math.sin(theta))*/ 0.15}, 
          loop: (new GameLoop(FRAME_LENGTH, sessionId, onFrame))
      };
    }
	return games[sessionId];
};

var killSession = function(sessionId) {
	delete games[sessionId];
};


function onFrame(sessionId, delta){
  	var ball = session(sessionId).ball;
  	var players = session(sessionId).players;
  	var flag = null;
  	if(Math.pow(ball.x, 2) + Math.pow(ball.y, 2) > Math.pow(GAME_RADIUS, 2)){
       	var conversionFactor = (180.0 / Math.PI);
  		var alpha = conversionFactor * Math.atan(Math.abs(ball.y) / Math.abs(ball.x));
  		var theta;
  		if (ball.y <= 0 && ball.x >= 0) {
          	theta = alpha;
		} else if (ball.y <= 0 && ball.x <= 0) {
          	theta = 180.0 - alpha;
        } else if (ball.y >= 0 && ball.x <= 0) {
          	theta = 180 + alpha;
        } else if (ball.y >= 0 && ball.x >= 0) {
          	theta = 360 - alpha;
        }
  		// Check if the ball is hitting anything
  		var angle = 0;
  		for (var i = 0; i < players.length; i += 1) {
          	if (theta >= angle && theta <= (angle + players[i].playerSize)) {
              	// Theta is in this sector
              	var thetaOffset = (theta - angle);
              	var thetaDisplacement = Math.abs(players[i].paddlePosition - thetaOffset);
              	if (thetaDisplacement <= players[i].paddleSize/2) {
                  	// The paddle covers the collision
                  	// Since there was a collision - time to bounce
                  	var variant = (players[i].paddlePosition - thetaOffset) / (players[i].paddleSize / 2.0);
					flag = 'bounce';
                  	session(sessionId).lastHit = i;
					var _x = ball.x;
					var _y = ball.y;
					var _dx = ball.dx;
					var _dy = ball.dy;
					var _c = 1.08; //speed multiplier
	

					var _m;
					var _A;

					_A = Math.sqrt(Math.pow(_dx, 2) + Math.pow(_dy, 2))*_c;
					_m = ((2 * (_y / _x)) + ((_dy / _dx) * Math.pow((_y / _x), 2) - (_dy / _dx))) / (((2 * (_y / _x)) * (_dy / _dx) - Math.pow((_y / _x), 2) + 1));
					_dx = Math.sqrt((Math.pow(_A, 2)) / (Math.pow(_m, 2) + 1));
					_dy = _m * _dx;
          	
          			var theta = Math.atan(_dx/_dy) + ((15) * variant);
          			_dx = _A * Math.sin(theta);
          			_dy = _A * Math.cos(theta);

					if (_dx * _x + _dy * _y > 0) {
						ball.dx = -1 * _dx;
						ball.dy = -1 * _dy;
					} else {
						ball.dx = _dx;
						ball.dy = _dy;
					}
                } else {
                  	flag = 'miss:' + session(sessionId).lastHit + ':' + i;
                  	session(sessionId).lastHit = -1;
                  	var theta = Math.PI * 2 * Math.random();
                  
                  	// Reset the position of the ball
                  	ball.x = 0;
                  	ball.y = 0;
                  	ball.dx = (INITIAL_VELOCITY * Math.cos(theta)); // 0.1;
                  	ball.dy = (INITIAL_VELOCITY * Math.sin(theta)); // 0.1;
                }
                break;
            }
          	angle += players[i].playerSize;
        }
    }
    ball.x += ball.dx*delta;
  	ball.y += ball.dy*delta;
	
  	var msg = JSON.stringify({type: 'ball', x: ball.x, y: ball.y, dx: ball.dx, dy: ball.dy, flag: flag });
	for(var i=0; i<players.length; i++){
      players[i].send(msg);
	}
}

//for testing opnly
app.get('/pong',function(req, res){
	res.sendfile(path.join('public','pages','desktop.html'));
});

app.get('/', function(req, res){
	var sessionId = md5('session' + Date.now() + Math.random());
	var user = md5('user' + Date.now() + Math.random());
	res.redirect('/' + sessionId + '/' + user);
});

app.get('/:session', function(req, res){
	var user = md5('user' + Date.now() + Math.random());
	res.redirect('/' + req.param('session') + '/' + user);
});

app.get('/:session/:user', function(req, res){
	res.sendfile(path.join('public','pages','desktop.html'));
});

var server = new WebSocketServer({port: 9001});
server.on('connection', function(socket){
	var sessionId;
	socket.on('message', function(data){
		var payload = JSON.parse(data);
    
		if (!sessionId) sessionId = payload.session;
    
		if (payload.type === 'connect'){
			socket.playerId = payload.user;
			session(sessionId).players.push(socket);
			var numPlayers = session(sessionId).players.length;
			socket.playerSize = 360.0 / numPlayers;
			socket.paddlePosition = socket.playerSize / 2.0;
      socket.paddleSize = socket.playerSize / 6.0;
			var multiplier = ((360.0 - socket.playerSize) / 360.0);
			var stateArray = [];
      
			for(var i = 0; i<numPlayers; i++){
      
				if (i !== (numPlayers - 1)) session(sessionId).players[i].playerSize *= multiplier;
				if (i !== (numPlayers - 1)) session(sessionId).players[i].paddlePosition *= multiplier;
        if (i !== (numPlayers - 1)) session(sessionId).players[i].paddleSize *= multiplier;
        
				stateArray.push({
					size: session(sessionId).players[i].playerSize, 
					paddlePosition: session(sessionId).players[i].paddlePosition,
          paddleSize: session(sessionId).players[i].paddleSize,
					id: session(sessionId).players[i].playerId
				});
			}
      
			socket.send(JSON.stringify({type: 'init', state: stateArray }));
      
			var beginObj = {type: 'newPlayer',  numPlayers: numPlayers, playerId: socket.playerId };
      
			for(var i=0; i < numPlayers - 1; i++){
				session(sessionId).players[i].send(JSON.stringify(beginObj));
			}
      
      for(var i=0; i < numPlayers; i++){
        console.log(session(sessionId).players[i].playerId);
			}
          	 
      session(sessionId).loop.begin();
		} else if (payload.type === 'paddleMove') {
      //console.log('got the paddle move', payload.paddlePosition, payload.id);
      socket.paddlePosition = payload.paddlePosition;
      
      console.log(payload);
          
			session(sessionId).players.forEach(function(player) {
				if (socket !== player) {
					player.send(data);
				}
			});
		}
	});
	
	socket.on('close', function(){
		var index = session(sessionId).players.indexOf(socket);
		var vacantSpace = session(sessionId).players[index].playerSize;
      	var playerId = session(sessionId).players[index].playerId;
		session(sessionId).players.splice(index, 1);
		var numPlayers = session(sessionId).players.length;
		var multiplier = (360.0 / (360.0 - vacantSpace));
      	console.log(numPlayers + ' players left');
      
		if (numPlayers > 0) {
          	
			var endObj = {
				type: 'playerLeave', 
				playerIndex: index, 
				id: playerId,
				numPlayers: numPlayers, 
				resumeTime: Date.now() + 4000
			};
			for(var i=0; i<numPlayers; i++){
				session(sessionId).players[i].size *= multiplier;
				session(sessionId).players[i].paddlePosition *= multiplier;
        session(sessionId).players[i].paddleSize *= multiplier;
				session(sessionId).players[i].send(JSON.stringify(endObj));
			}
		} else {
			killSession(sessionId);
		}
	});
	
});
app.listen(4000);