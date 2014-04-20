var updateCircleRadius;
var tutorialOver = false;

// load all the audio
var epic = new Audio('./assets/sounds/epic-mix.mp3');
var soundPaddle1 = new Audio('./assets/sounds/paddle-hit-1.wav');
var soundPaddle2 = new Audio('./assets/sounds/paddle-hit-2.wav');
var soundStart = new Audio('./assets/sounds/game-start.wav');
var soundEnd = new Audio('./assets/sounds/game-end.wav');

app.controller('GameCtrl', function($scope, $routeParams, $rootScope, SocketSvc) {
	epic.play();
	SocketSvc.connect($routeParams.session, $routeParams.user, function() {
		console.log('Connection established.');
		doEventRegistration();
	});

	// The current state
	$scope.state = null;
	$scope.me = null;
	$scope.session = $routeParams.session;

	// Register for events
	var doEventRegistration = function() {
		SocketSvc.on('init', function(payload) {
			// When we just got here
			$scope.state = payload.state;
			$scope.me = $scope.state[$scope.state.length - 1];
			console.log('state', payload);
			$rootScope.$broadcast('INIT_PLAYERS', {
				state: payload.state
			});
		});
		SocketSvc.on('newPlayer', function(payload) {
			// Resize existing regions
			var multiplier = ((360.0 - (360.0 / payload.numPlayers)) / 360.0);
			var runningTotal = 0;
			for (var i = 0; i < $scope.state.length; i++) {
				$scope.state[i].size *= multiplier;
				$scope.state[i].paddlePosition *= multiplier;
				runningTotal += $scope.state[i].size;
			}
			var player = {
				size: (360.0 - runningTotal),
				paddlePosition: ((360.0 - runningTotal) / 2.0),
				id: payload.playerId
			};
			$scope.state.push(player);
			$rootScope.$broadcast('NEW_PLAYER', player);
		});
		SocketSvc.on('playerLeave', function(payload) {
			var vacantSpace = $scope.state[payload.playerIndex].size;
			$scope.state.splice(payload.playerIndex, 1);
			var multiplier = (360.0 / (360.0 - vacantSpace));
			for (var i = 0; i < $scope.state.length; i++) {
				$scope.state[i].size *= multiplier;
				$scope.state[i].paddlePosition *= multiplier;
			}
			console.log('leave', $scope.state);
			$rootScope.$broadcast('PLAYER_LEFT', {
				id: payload.id
			});
		});
		SocketSvc.on('paddleMove', function(payload) {
			// Look for which sector's quadrant moved
			//$scope.state[payload.id].paddlePosition = payload.paddlePosition;
			$rootScope.$broadcast('PADDLE_MOVE', {
				id: payload.id,
				angle: payload.paddlePosition
			});
		});
		SocketSvc.on('ball', function(payload) {
			// Look for which sector's quadrant moved
			//$scope.state[payload.id].paddlePosition = payload.paddlePosition;
			$rootScope.$broadcast('BALL_MOVE', {
				x: payload.x,
				y: payload.y,
				dx: payload.dx,
				dy: payload.dy,
              flag: payload.flag
			});
		});
	};

	// Get the animations started
	initAnimations();
});

var initAnimations = function() {
	$(document).ready(function() {
		var logo = $("#logo");
		logo.delay(2000).animate({
			top: '200px',
			zoom: '0.30'
		}, 1500);

		var width = Math.min(750, $(window).width() - 200);
		var height = Math.min(750, $(window).height() - 200);
		var size = Math.min(width, height);
		$("#circle").delay(2000).animate({
			width: (size + 'px'),
			height: (size + 'px'),
			marginTop: ((-size / 2) + 'px'),
			marginLeft: ((-size / 2) + 'px')
		}, 1500);

		width = Math.min(770, $(window).width() - 180);
		height = Math.min(770, $(window).height() - 180);
		size = Math.min(width, height);
		$("#circle-outline").css("width", size);
		$("#circle-outline").css("height", size);
		$("#circle-outline").css("margin-left", -size / 2);
		$("#circle-outline").css("margin-top", -size / 2);

		$("#circle-outline").delay(3500).fadeTo(500, 1);
		$("#footer").delay(3500).fadeTo(1000, 1);
		$("#circle #pong").delay(3500).fadeTo(1000, 1);

		$("#message").delay(5000).fadeTo(500, 1);
		$("#message").text("move your paddle with the arrow keys");
		setTimeout(endTutorial, 10000);
	});

	function endTutorial() {
		$("#message").fadeTo(500, 0);
		tutorialOver = true;
	};

	var resizeTheCircle = function() {
		var width = Math.min(750, $(window).width() - 200);
		var height = Math.min(750, $(window).height() - 200);
		var size = Math.min(width, height);
		$("#circle").css("width", size);
		$("#circle").css("height", size);
		$("#circle").css("margin-left", -size / 2);
		$("#circle").css("margin-top", -size / 2);

		$('#circle #pong').css("margin-top", -(1000 - size) / 2);
		$('#circle #pong').css("margin-left", -(1000 - size) / 2);

		updateCircleRadius(size / 2.0);
		console.log('updating circle radius');

		if (size <= 100) {
			$("#footer p").text("ಠ_ಠ");
			$("#footer p").css("font-size", 36);
			$("#footer p").css("font-family", "Helvetica");
			$("#footer p").css("margin-left", -36);
		} else {
			$("#footer p").text("lonely?  invite some friends");
			$("#footer p").css("font-size", 20);
			$("#footer p").css("font-family", "Roboto");
			$("#footer p").css("margin-left", -119.5);
		}

		var width = Math.min(770, $(window).width() - 180);
		var height = Math.min(770, $(window).height() - 180);
		var size = Math.min(width, height);
		$("#circle-outline").css("width", size);
		$("#circle-outline").css("height", size);
		$("#circle-outline").css("margin-left", -size / 2);
		$("#circle-outline").css("margin-top", -size / 2);
	};

	$(window).resize(resizeTheCircle);
};

app.controller('PongCtrl', ['$scope', '$routeParams', '$rootScope', 'SocketSvc',
	function($scope, $routeParams, $rootScope, SocketSvc) {
		//variables
		var radius = 375;
		var num_sectors = 1;
		var userId = $routeParams.user;
		var keysdown = false;

		var keyPressedLeft = false;
		var keyPressedRight = false;
		updateCircleRadius = function(newRadius) {
			radius = newRadius;
			if (stage) stage.update();
		};
      
      function findUser(id) {
        for(var i = 0; i < gameObjSectorsArray.length ;i+=1){
            if(gameObjSectorsArray[i].id === id){
              return gameObjSectorsArray[i];
            } 
        }
        return null;
      }

		var centerPoint = {
			x: 500,
			y: 500,
		};

		var gameObjSectors = {};
		var gameObjSectorsArray = [];

		var colors = [
			'#8e44ad',
			'#2980b9',
			'#27ae60',
			'#16a085',
			'#f39c12',
			'#d35400',
			'#c0392b',
			'#bdc3c7',
			'#7f8c8d'
		];

		//objects

		function gameObjBall() {
			this.x = 0;
			this.y = 0;
			this.dx = 0;
			this.dy = 0;
			this.radius = 10;
			this.color = 'white';

			this.drawing = new createjs.Shape();
			this.drawing.graphics.beginFill(this.color).drawCircle(0, 0, this.radius);

            this.update = function(){
             	this.x = this.dx + this.x;
				this.y = this.dy + this.y;
              
            	this.drawing.x = centerPoint.x + this.x;
				this.drawing.y = centerPoint.y + this.y;
            }
            
            this.sync = function(payload){
            	this.x = payload.x;
                this.y = payload.y;
                this.dx = payload.dx;
                this.dy = payload.dy;
			};

			if (stage) stage.addChild(this.drawing);
		}

      
		function gameObjPaddle(archDistance, angle, sector) {
			this.archDistance = Math.min(sector.range, archDistance);
			this.angle = Math.min(angle, sector.range - archDistance / 2);
			this.angle = Math.max(angle, archDistance / 2);
			this.sector = sector;
			this.drawing = new createjs.Shape();
			this.keypressed = false;

			this.drawing.x = centerPoint.x;
			this.drawing.y = centerPoint.y;
			stage.addChild(this.drawing);

			this.angularVelocity = 0;
			this.angularVelocityMin = 5;
			this.angularVelocityMax = 10;
			this.angularAcceleration = 5;

			this.moveClockwise = function() {
              if (this.angularVelocity > -this.angularVelocityMax) {
					this.angularVelocity -= this.angularAcceleration;
				} else {
					this.angularVelocity = -this.angularVelocityMax;
				}
				this.angularVelocity = Math.min(-this.angularVelocityMin, this.angularVelocity);
				console.log('speed' + this.angularVelocity)
				this.keypressed = true;
			};

			this.moveCounterClockwise = function() {
				if (this.angularVelocity < this.angularVelocityMax) {
					this.angularVelocity += this.angularAcceleration;
				} else {
					this.angularVelocity = this.angularVelocityMax;
				}
				this.angularVelocity = Math.max(this.angularVelocityMin, this.angularVelocity);
				this.keypressed = true;
			};

			this.normalize = function() {
				this.archDistance = Math.min(this.sector.range, this.archDistance)
				this.angle = Math.min(this.angle, sector.range - this.archDistance / 2);
				this.angle = Math.max(this.angle, this.archDistance / 2);
				this.drawing.graphics.clear();
				this.drawing.graphics.beginStroke('white')
					.setStrokeStyle(5).arc(0, 0, radius + 5, 0, this.archDistance * (Math.PI / 180));
			};

			this.update = function() {
				this.angle += this.angularVelocity;
				if (this.angularVelocity) SocketSvc.movePaddle(-1, userId, this.angle);
				this.angle = this.angle % 360;
				this.normalize();
				this.drawing.rotation = (-(this.angle + this.archDistance / 2) + this.sector.angle);
				this.keypressed = false;

				if (keyPressedLeft == false && keyPressedRight == false) {

					if (this.angularVelocity > 0) {
						this.angularVelocity = Math.max(0, this.angularVelocity - 1);
					}

					if (this.angularVelocity < 0) {
						this.angularVelocity = Math.min(0, this.angularVelocity + 1);
					}

				}
			}

			this.breakMovement = function() {
				this.angularVelocity -= this.angularAcceleration;
			};

		}

		function gameObjSector(drawing, range, color, id) {
			this.drawing = drawing;
			this.range = range;
			this.color = color;
			this.paddle = null;
			this.score = 0;
			this.angle = 0;
          	this.id = id;
		}

		//function 

		//functions

		function createSector(userId, paddleSize) {

			if (gameObjSectorsArray.length < 8) {

				var drawing = new createjs.Shape();
				var colorId = gameObjSectorsArray.length;
				var color = colors[colorId];

				drawing.graphics.beginStroke(color)
					.setStrokeStyle(radius).arc(0, 0, radius / 2, 0, (360 / (1 + gameObjSectorsArray.length)) * (Math.PI / 180));

				drawing.x = centerPoint.x;
				drawing.y = centerPoint.y;
				stage.addChild(drawing);

				var sector = new gameObjSector(drawing, 360 / (1 + gameObjSectorsArray.length), color, userId);

				gameObjSectorsArray.push(sector);
        

				sector.paddle = new gameObjPaddle(paddleSize, 0, sector);

				recalculateSectors();

				refreshBall();
              
              console.log(gameObjSectorsArray);
              console.log(userId, sector);
			}

		}

		function refreshBall() {
			stage.removeChild(ball.drawing);
			stage.addChild(ball.drawing);
		}

		function deleteSector(userId) {

			if (gameObjSectorsArray.length > 0) {
              
				stage.removeChild(gameObjSectors[userId].drawing);
				stage.removeChild(gameObjSectors[userId].paddle.drawing);

				for (var i = 0; i < gameObjSectorsArray.length; i += 1) {
					if (gameObjSectorsArray[i] == userId) {
						gameObjSectorsArray.splice(i, 1);
					}
				}

				delete gameObjSectors[userId].paddle;
				delete gameObjSectors[userId];

				var new_object = {};

				for (var i in gameObjSectors) {
					new_object[i] = gameObjSectors[i];
				}

				gameObjSectors = new_object;

				// console.log(gameObjSectors);

				recalculateSectors();

				// console.log(gameObjSectors);
				refreshBall();
			}

		}

		function recalculateSectors() {

			var previousRange = 0;

			// console.log(num);

			for (var i = 0; i < gameObjSectorsArray.length; i += 1) {
				//gameObjSectors[i].range *= ((1 - num)/360);
				gameObjSectorsArray[i].range = 360 / gameObjSectorsArray.length;

				//if (i == num-1)
				//	gameObjSectors[i].range = 360- previousRange

				gameObjSectorsArray[i].drawing.rotation = previousRange; // + 180 -gameObjSectors[i].range/2;
				gameObjSectorsArray[i].angle = 360 - previousRange; // + 180 - gameObjSectors[i].range/2;
				gameObjSectorsArray[i].paddle.archDistance = gameObjSectorsArray[i].range/6;
                gameObjSectorsArray[i].paddle.normalize();
              	
                previousRange += gameObjSectorsArray[i].range;

				//console.log('r[', i, ']', gameObjSectors[gameObjSectorsArray[i]].range);

			}

			// console.log(gameObjSectors);

		}

		function updatePaddles() {
          for (var i = 0; i < gameObjSectorsArray.length; i += 1) {
           	gameObjSectorsArray[i].paddle.update(); 
          }
		}

		var ball = new gameObjBall();

		//createjs
		var stage = new createjs.Stage("pong");
		createjs.Ticker.addEventListener("tick", tick);

		$rootScope.$on('INIT_PLAYERS', function(evt, payload) {
			payload.state.forEach(function(player) {
				createSector(player.id, player.paddleSize);
			});
		});
		$rootScope.$on('NEW_PLAYER', function(evt, payload) {
			createSector(payload.id, payload.paddleSize);
		});
		$rootScope.$on('PLAYER_LEFT', function(evt, payload) {
			deleteSector(payload.id);
		});
		$rootScope.$on('PADDLE_MOVE', function(evt, payload) {
          
			findUser(payload.id).paddle.angle = payload.angle;
			findUser(payload.id).paddle.normalize();
		});
		$rootScope.$on('BALL_MOVE', function(evt, payload) {
          if (payload.flag != null) {
			if (payload.flag === 'bounce') {
				if (Math.random() % 2 > 0.5) {
					soundPaddle1.play();
				} else {
					soundPaddle2.play();
				}
			} else if (payload.flag.substring(0,4) === 'miss') {
				soundEnd.play(payload);
              	//addScore(payload.flag.split(":")[1], payload.flag.split(":")[2]);
			}
          }

			ball.sync(payload);
          
		});

		// console.log(gameObjSectors);

		function tick(event) {
			updatePaddles();
          	ball.update();
			stage.update();
		}
      

		$(document).keydown(function(event) {
			if (event.which === 37) {
				//console.log("right");
				$scope.$apply(function() {
                  
                  	
					findUser(userId).paddle.moveClockwise();
					keyPressedRight = true;
				});
			} else if (event.which === 39) {
				//console.log("left");
				$scope.$apply(function() {
					findUser(userId).paddle.moveCounterClockwise();
					keyPressedLeft = true;
				});
			}
		});

		$(document).keyup(function(event) {
			if (event.which === 37) {
				//console.log("right");
				$scope.$apply(function() {
					keyPressedRight = false;
				});
			} else if (event.which === 39) {
				//console.log("left");
				$scope.$apply(function() {
					keyPressedLeft = false;
				});
			}
		});
	}
]);