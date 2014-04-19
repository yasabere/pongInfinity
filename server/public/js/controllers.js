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
	function gameObjSector(drawing, range, color){
		this.drawing = drawing;
		this.range = range;
		this.color = color;
	}

	//functions

	function createSector(){

		var drawing = new createjs.Shape();

		var color = colors[Math.round(Math.random() * colors.length)];
		console.log(  Math.round(Math.random() * colors.length));

		drawing.graphics.beginStroke(color)
		    .setStrokeStyle(radius).arc(0,0, radius/2, 0, (360 / (1 + gameObjSectors.length)) * (Math.PI/180));

		drawing.x = centerPoint.x;
		drawing.y = centerPoint.y;
		stage.addChild(drawing);

		gameObjSectors.push(new gameObjSector(drawing, 360/(1 + gameObjSectors.length), color));

		console.log(new gameObjSector(drawing, 360/(1 + gameObjSectors.length), color));

		recalculateSectors();
	}

	function recalculateSectors(){

		var num = gameObjSectors.length;
		var previousRange = 0; 

		for(var i = 0; i < num ; i++){
			gameObjSectors[i].range *= ((num)/360);
			gameObjSectors[i].angle = previousRange;
			previousRange = gameObjSectors[i].range;
		}

	}


	//createjs
	var stage = new createjs.Stage("demoCanvas");
	createjs.Ticker.addEventListener("tick", tick);


	createSector();
	createSector();
	createSector();
	createSector();
	createSector();
	createSector();

	console.log(gameObjSectors);

	function tick(event) {    
	    stage.update();
	}
}]);