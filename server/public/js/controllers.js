app.controller('PongStage', ['$scope', function($scope) {

	//variables
	var radius = 150;
	var num_sectors = 3;
	var userId = '1';
	var keysdown = false;
	var bounced = false;

	var centerPoint = {
		x:200,
		y:250,
	};

	var gameObjSectors = {};
	var gameObjSectorsArray = [];

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

	function gameObjBall(){
		this.x = 40;
		this.y = 0;
		this.dx = 5;
		this.dy = -5;
		this.color = 'white';

		this.drawing = new createjs.Shape();
		this.drawing.graphics.beginFill("red").drawCircle(0, 0, 10);
		
		stage.addChild(this.drawing);

		this.bounce = function(){

			var _x = this.x;
			var _y = this.y;
			var _dx = this.dx;
			var _dy = this.dy;
			var _c = 1.00; //speed multiplyer


			var _m;
			var _A;

			_A = Math.sqrt( Math.pow(_dx,2) + Math.pow(_dy,2) );


			_m = ((2*(_y/_x)) + ( (_dy/_dx) * Math.pow((_y/_x),2)-(_dy/_dx))) /( ( (2*(_y/_x)) * (_dy/_dx) - Math.pow((_y/_x),2) + 1 ));

			_dx = Math.sqrt( (Math.pow(_A,2) * Math.pow(_c,2) ) / ( Math.pow(_m,2) + 1) );

			_dy = _m * _dx;

			// if (Math.sqrt(Math.pow(this.x + _dx,2) + Math.pow(this.y + _dy ,2) > radius)){
			// 	this.dx = -_dx;
			// 	this.dy = -_dy;
			// }else{
			// 	this.dx = _dx;
			// 	this.dy = _dy;
			// }
			if (_dx * _x + _dy * _y > 0) {
				console.log('flip');
				this.dx = -1 * _dx;
				this.dy = -1 * _dy;
			} else {
				this.dx = _dx;
				this.dy = _dy;
			}

		};

		this.update = function(){
			if ( Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2)) > radius ){
				this.bounce();
			}
			
			this.x += this.dx;
			this.y += this.dy;

			console.log(Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2)));

			this.drawing.x = this.x + centerPoint.x;
			this.drawing.y = this.y + centerPoint.y;

		};
	}

	function gameObjPaddle(archDistance, angle, sector){
		this.archDistance = Math.min(sector.range, archDistance);
		this.angle = Math.min(angle, sector.range - archDistance/2);
		this.angle = Math.max(angle, archDistance/2);
		this.sector = sector;
		this.drawing = new createjs.Shape();
		this.keypressed = false;

		this.drawing.x = centerPoint.x;
		this.drawing.y = centerPoint.y;
		stage.addChild(this.drawing);

		this.angularVelocity = 0;
		this.angularVelocityMax =  10;
		this.angularAcceleration = 3; 

		this.moveClockwise = function(){
			if(this.angularVelocity > -this.angularVelocityMax){
				this.angularVelocity-=this.angularAcceleration;
			}
			else{
				this.angularVelocity=-this.angularVelocityMax;
			}
			this.keypressed = true;
		};

		this.moveCounterClockwise = function(){
			if(this.angularVelocity < this.angularVelocityMax){
				this.angularVelocity+=this.angularAcceleration;
			}
			else{
				this.angularVelocity=this.angularVelocityMax;
			}
			this.keypressed = true;
		};

		this.normalize = function(){
			this.archDistance = Math.min(this.sector.range, this.archDistance)
			this.angle = Math.min(this.angle, sector.range - this.archDistance/2);
			this.angle = Math.max(this.angle, this.archDistance/2);
			this.drawing.graphics.clear();
			this.drawing.graphics.beginStroke('white')
		    	.setStrokeStyle(5).arc(0,0, radius+5, 0, this.archDistance * (Math.PI/180));
		};

		this.update = function(){
			this.angle += this.angularVelocity;

			if (this.keypressed == false){
				if(this.angularVelocity > 0){
					this.angularVelocity -= 2;
				}
				else{
					this.angularVelocity = 0;
				}
			}

			this.angle = this.angle % 360;
			this.normalize();
			this.drawing.rotation = (-(this.angle+this.archDistance/2 ) + this.sector.angle);
			this.keypressed = false;
		}

		this.breakMovement = function(){
			this.angularVelocity -= this.angularAcceleration;
		};
		
	}

	function gameObjSector(drawing, range, color){
		this.drawing = drawing;
		this.range = range;
		this.color = color;
		this.paddle = null;
		this.score = 1;
		this.angle = 0;
	}

	//function 

	//functions

	function createSector(userId){

		if(gameObjSectorsArray.length < 8){

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

			gameObjSectorsArray.push(userId);

			sector.paddle = new gameObjPaddle(10, 0 ,sector);

			console.log(sector);
			recalculateSectors();
		}

	}

	function deleteSector(userId){

		if(gameObjSectorsArray.length > 0){

			colors.push(gameObjSectors[userId].color);

			stage.removeChild(gameObjSectors[userId].drawing);
			stage.removeChild(gameObjSectors[userId].paddle.drawing);

			for(var i = 0; i <gameObjSectorsArray.length; i+=1){
				if(gameObjSectorsArray[i] == userId){
					gameObjSectorsArray.splice (i, 1);
				}
			}

			delete gameObjSectors[userId].paddle;
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

	}

	function recalculateSectors(){

		var num = Object.keys(gameObjSectors).length;
		var previousRange = 0; 

		console.log(num);

		for(var i = 0; i < gameObjSectorsArray.length ; i +=1){
			//gameObjSectors[i].range *= ((1 - num)/360);
			gameObjSectors[gameObjSectorsArray[i]].range = 360/num;

			//if (i == num-1)
			//	gameObjSectors[i].range = 360- previousRange

			gameObjSectors[gameObjSectorsArray[i]].drawing.rotation = previousRange;// + 180 -gameObjSectors[i].range/2;
			gameObjSectors[gameObjSectorsArray[i]].angle = previousRange;// + 180 - gameObjSectors[i].range/2;
			previousRange += gameObjSectors[gameObjSectorsArray[i]].range;

			console.log('r[', i, ']', gameObjSectors[gameObjSectorsArray[i]].range);

		}

	}

	function updatePaddles(){
		for(var i  in gameObjSectors){

			gameObjSectors[i].paddle.update();
			
		}
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

	var ball = new gameObjBall();

	console.log(gameObjSectors);

	function tick(event) { 
		updatePaddles();
		ball.update();  
	    stage.update();
	}

	$scope.addPlayer = function(){
		createSector(Object.keys(gameObjSectors).length+1+'');
	};

	$scope.removePlayer = function(){
		deleteSector(Object.keys(gameObjSectors).length);
	}

	$(document).keydown(function(event) {
      if (event.which === 37) {
        //console.log("right");
        $scope.$apply(function() {
        	gameObjSectors[userId].paddle.moveClockwise();
        });
      } else if (event.which === 39) {
        //console.log("left");
        $scope.$apply(function() {
          	gameObjSectors[userId].paddle.moveCounterClockwise();
        });
      }
    });


}]);