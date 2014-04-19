module.exports = function(frameLength, gameDataId, onFrame){
	this.interval;
	var previousTime;
	
	var gameLoop = function() {
		var now = Date.now();
		this.interval = setTimeout(gameLoop, 2*frameLength - (now - previousTime));
		onFrame(gameDataId, now - previousTime);
		previousTime = now;
	}
	
	this.begin = function(){
		previousTime = Date.now() - frameLength;
		gameLoop();
	}
	
	this.stop = function(){
		clearTimeout(this.interval);
	}
}
