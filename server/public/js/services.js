app.service('SocketSvc', function() {
	var client = turbo();
	this.connect = function(sessionId, userId, cb) {
		client.connect(sessionId, userId, cb);
	};
	this.on = function(key, cb) {
		client.on(key, function() {
			delete arguments[0]['type'];
			cb(arguments[0]);
		});
	};
	this.movePaddle = function(playerIndex, playerId, newPos) {
		client.send(JSON.stringify({
			type: 'paddleMove',
			playerIndex: playerIndex,
			id: playerId,
			paddlePosition: newPos
		}));
	};
  	this.sendBounce = function(x, y, dx, dy, hitter) {
		client.send(JSON.stringify({
			type: 'bounce',
			x: x,
			y: y,
			dx: dx,
          	dy: dy,
          	hitter: hitter
		}));
	};
    this.sendMiss = function(dx, dy, misser) {
      	client.send(JSON.stringify({
			type: 'miss',
			dx: dx,
          	dy: dy,
          	misser: misser
		}));
    };
});