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
	this.movePaddle = function(playerIndex, newPos) {
		client.send(JSON.stringify({
			type: 'paddleMove',
			playerIndex: playerIndex,
			paddlePosition: newPos
		}));
	};
});