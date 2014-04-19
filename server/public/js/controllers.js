app.controller('PongStage', ['$scope', function($scope) {
	$scope.test = 'Hola!';

	//variables
	var radius = 100;
	var num_sectors = 3;

	var centerPoint = {
		x:200,
		y:100,
	};

	var gameObjSectors = [];
	var colors = [
		'#1abc9c',
		'#2ecc71',
		'#3498db',
		'#9b59b6',
		'#16a085',
		'#27ae60',
		'#2980b9',
		'#8e44ad',
		'#f1c40f',
		'#e67e22',
		'#e74c3c',
		'#f39c12',
		'#d35400',
		'#c0392b',
		];

	//objects
	function gameObjPaddle(archDistance, angle, sector){
		this.archDistance = Math.min(sector.range, archDistance)
		this.angle = Math.min(angle, sector.range - archDistance/2);
		this.angle = Math.max(angle, sarchDistance/2);

		this.angularVelocity = 0;
		this.angularVelocityMax = 3;
		this.angularAcceleration = 1; 

		this.moveClockwise() = function(){

			this.angle = this.angle % 360;

		}

		this.moveCounterClockwise() = function(){
			this.angle = this.angle % 360;
		}
		
	}

	function gameObjSector(drawing, range, color){
		this.drawing = drawing;
		this.range = range;
		this.color = color;
		this.paddle = null;
		this.score = 1;
	}

	//function 

	//functions

	function createSector(userId){

		var drawing = new createjs.Shape();
		var colorId = Math.round(Math.random() * (colors.length-1));
		var color = colors[colorId];
		colors.splice(colorId,1);
		console.log(colors);

		drawing.graphics.beginStroke(color)
		    .setStrokeStyle(radius).arc(0,0, radius/2, 0, (360 / (1 + Object.keys(gameObjSectors).length)) * (Math.PI/180));

		drawing.x = centerPoint.x;
		drawing.y = centerPoint.y;
		stage.addChild(drawing);

		var sector = new gameObjSector(drawing, 360/(1 + Object.keys(gameObjSectors).length), color);
		gameObjSectors[userId] = sector;
		console.log(sector);
		recalculateSectors();
	}

	function deleteSector(userId){

		stage.removeChild(gameObjSectors[userId].drawing);

		delete gameObjSectors[userId]; 

		var new_object = {};

		for(var i  in gameObjSectors){
			new_object[i] = gameObjSectors[i];
		}

		gameObjSectors = new_object;

		console.log(gameObjSectors);

		recalculateSectors();

		console.log(gameObjSectors);

	}

	function recalculateSectors(){

		var num = Object.keys(gameObjSectors).length;
		var previousRange = 0; 

		console.log(num);

		for(var i  in gameObjSectors){
			//gameObjSectors[i].range *= ((1 - num)/360);
			gameObjSectors[i].range = 360/num;

			//if (i == num-1)
			//	gameObjSectors[i].range = 360- previousRange

			gameObjSectors[i].drawing.rotation = previousRange;
			previousRange += gameObjSectors[i].range;

			console.log('r[', i, ']', gameObjSectors[i].range);

		}

	}

	function updatePaddles(){

	}

	function score(){

	}

	function defended(){

	}

	//createjs
	var stage = new createjs.Stage("demoCanvas");
	createjs.Ticker.addEventListener("tick", tick);

	createSector('1');
	createSector('2');
	createSector('3');
	createSector('4');
	createSector('5');
	createSector('6');

	deleteSector('6');
	deleteSector('5');

	console.log(gameObjSectors);

	function tick(event) {    
	    stage.update();
	}

	$scope.addPlayer = function(){
		createSector(Object.keys(gameObjSectors).length+1+'');
	};

	$scope.removePlayer = function(){
		deleteSector(Object.keys(gameObjSectors).length);
	}
}]);