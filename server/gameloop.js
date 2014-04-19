module.exports = function(frameLength, gameDataId, onFrame){
	var previousTime;
	var interval;
	
	var gameLoop = function() {
		var now = Date.now();
		interval = setTimeout(gameLoop, 2*frameLength - (now - previousTime));
		onFrame(gameDataId, now - previousTime);
		previousTime = now;
	}
	
	this.begin = function(){
		previousTime = Date.now() - frameLength;
		gameLoop();
	}
	
	this.stop = function(){
		clearTimeout(interval);
	}
}
