var updateCircleRadius;

// load all the audio
var soundPaddle1 = new Audio('./assets/sounds/paddle-hit-1.wav');
var soundPaddle2 = new Audio('./assets/sounds/paddle-hit-2.wav');
var soundStart = new Audio('./assets/sounds/game-start.wav');
var soundEnd = new Audio('./assets/sounds/game-end.wav');
var epic = new Audio('./assets/sounds/epic-mix.mp3');

app.controller('GameCtrl', function($scope, $routeParams, $rootScope, SocketSvc) {
	epic.play();
	SocketSvc.connect($routeParams.session, $routeParams.user, function() {
		console.log('Connection established.');
		doEventRegistration();
	});
	// The current state
	$scope.state = null;
	$scope.me = null;
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
	};

	// Get the animations started
	initAnimations();
});

var initAnimations = function() {
	$(document).ready(function() {
		var logo = $("#logo");
		logo.delay(2000).animate({
			top: '200px',
			zoom: '0.25'
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
	});

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

	var addScore = function(color, score) {
		var scoreItem = $('<div></div>');
		scoreItem.attr("class", "score-item");
		scoreItem.css("background-color", color);

		var scoreText = $('<p>' + score + '</p>');
		scoreItem.append(scoreText);

		$("#scoreboard").append(scoreItem);
	};
};

app.controller('PongCtrl', ['$scope', '$routeParams', '$rootScope', 'SocketSvc',
	function($scope, $routeParams, $rootScope, SocketSvc) {
		//variables
		var radius = 250;
		var num_sectors = 1;
		var userId = $routeParams.user;
		var keysdown = false;
		var bounced = false;

		updateCircleRadius = function(newRadius) {
			radius = newRadius;
			if (stage) stage.update();
		};

		var centerPoint = {
			x: 500,
			y: 500,
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

		function gameObjBall() {
			this.x = 40;
			this.y = 0;
			this.dx = 5;
			this.dy = 0;
			this.radius = 10;
			this.color = 'white';

			this.drawing = new createjs.Shape();
			this.drawing.graphics.beginFill(this.color).drawCircle(0, 0, this.radius);

			stage.addChild(this.drawing);

			this.bounce = function(variant) {
				console.log('variant', variant);

				var _x = this.x;
				var _y = this.y;
				var _dx = this.dx;
				var _dy = this.dy;
				var _c = 1.00; //speed multiplyer


				var _m;
				var _A;

				_A = Math.sqrt(Math.pow(_dx, 2) + Math.pow(_dy, 2));
				_m = ((2 * (_y / _x)) + ((_dy / _dx) * Math.pow((_y / _x), 2) - (_dy / _dx))) / (((2 * (_y / _x)) * (_dy / _dx) - Math.pow((_y / _x), 2) + 1));
				_dx = Math.sqrt((Math.pow(_A, 2) * Math.pow(_c, 2)) / (Math.pow(_m, 2) + 1));
				_dy = _m * _dx;

				if (_dx * _x + _dy * _y > 0) {
					this.dx = -1 * _dx;
					this.dy = -1 * _dy;
				} else {
					this.dx = _dx;
					this.dy = _dy;
				}
			};
			// Checks collision for the ball
			this.update = function() {
				if (Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)) > (radius - this.radius)) {
					var conversionFactor = (180.0 / Math.PI);
					var alpha = conversionFactor * Math.atan(Math.abs(this.y) / Math.abs(this.x));
					var theta;
					if (this.y <= 0 && this.x >= 0) {
						theta = alpha;
					} else if (this.y <= 0 && this.x <= 0) {
						theta = 180.0 - alpha;
					} else if (this.y >= 0 && this.x <= 0) {
						theta = 180 + alpha;
					} else if (this.y >= 0 && this.x >= 0) {
						theta = 360 - alpha;
					}
					// Check if the ball is hitting anything
					var isMiss = true;
					for (var i = 0; i < gameObjSectorsArray.length; i += 1) {
						var sector = gameObjSectors[gameObjSectorsArray[i]];
						if (theta >= sector.angle && theta <= (sector.angle + sector.range)) {
							// Theta is in this sector
							var thetaOffset = (theta - sector.angle);
							var thetaDisplacement = Math.abs(sector.paddle.angle - thetaOffset);
							if (thetaDisplacement <= sector.paddle.archDistance) {
								// The paddle covers the collision
								console.log('There was a collision with sector ', i, '\'s paddle');
								// Since there was a collision - time to bounce
								this.bounce(thetaDisplacement / sector.paddle.archDistance);
								isMiss = false;
								if (Math.random() % 2 > 0.5) {
									soundPaddle1.play();
								} else {
									soundPaddle2.play();
								}
								break;
							}
						}
					}
					// Check if we missed
					if (isMiss) {
						// The paddle misses
						console.log('There was a MISS');
						soundEnd.play();

						// Reset the position of the ball
						this.x = 0;
						this.y = 0;
					}
				}
				// Move the ball
				this.x += this.dx;
				this.y += this.dy;
				//console.log(Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2)));
				// Draws the ball
				this.drawing.x = this.x + centerPoint.x;
				this.drawing.y = this.y + centerPoint.y;
			};
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

				if (this.keypressed == false) {
					//if(this.angularVelocity > 0){
					//	this.angularVelocity -= 2;
					//}
					//else{
					//this.angularVelocity = 0;
					//}
				}
			}

			this.breakMovement = function() {
				this.angularVelocity -= this.angularAcceleration;
			};

		}

		function gameObjSector(drawing, range, color) {
			this.drawing = drawing;
			this.range = range;
			this.color = color;
			this.paddle = null;
			this.score = 1;
			this.angle = 0;
		}

		//function 

		//functions

		function createSector(userId) {

			if (gameObjSectorsArray.length < 8) {

				var drawing = new createjs.Shape();
				var colorId = Math.round(Math.random() * (colors.length - 1));
				var color = colors[colorId];
				colors.splice(colorId, 1);

				drawing.graphics.beginStroke(color)
					.setStrokeStyle(radius).arc(0, 0, radius / 2, 0, (360 / (1 + Object.keys(gameObjSectors).length)) * (Math.PI / 180));

				drawing.x = centerPoint.x;
				drawing.y = centerPoint.y;
				stage.addChild(drawing);

				var sector = new gameObjSector(drawing, 360 / (1 + Object.keys(gameObjSectors).length), color);
				gameObjSectors[userId] = sector;

				gameObjSectorsArray.push(userId);

				sector.paddle = new gameObjPaddle(10, 0, sector);

				recalculateSectors();

				refreshBall();
			}

		}

		function refreshBall() {
			stage.removeChild(ball.drawing);
			stage.addChild(ball.drawing);
		}

		function deleteSector(userId) {

			if (gameObjSectorsArray.length > 0) {

				colors.push(gameObjSectors[userId].color);

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

			var num = Object.keys(gameObjSectors).length;
			var previousRange = 0;

			// console.log(num);

			for (var i = 0; i < gameObjSectorsArray.length; i += 1) {
				//gameObjSectors[i].range *= ((1 - num)/360);
				gameObjSectors[gameObjSectorsArray[i]].range = 360 / num;

				//if (i == num-1)
				//	gameObjSectors[i].range = 360- previousRange

				gameObjSectors[gameObjSectorsArray[i]].drawing.rotation = previousRange; // + 180 -gameObjSectors[i].range/2;
				gameObjSectors[gameObjSectorsArray[i]].angle = previousRange; // + 180 - gameObjSectors[i].range/2;
				previousRange += gameObjSectors[gameObjSectorsArray[i]].range;

				//console.log('r[', i, ']', gameObjSectors[gameObjSectorsArray[i]].range);

			}

			// console.log(gameObjSectors);

		}

		function updatePaddles() {
			for (var i in gameObjSectors) {

				gameObjSectors[i].paddle.update();

			}
		}

		function score() {

		}

		function defended() {

		}

		//createjs
		var stage = new createjs.Stage("pong");
		createjs.Ticker.addEventListener("tick", tick);

		$rootScope.$on('INIT_PLAYERS', function(evt, payload) {
			payload.state.forEach(function(player) {
				createSector(player.id);
			});
		});
		$rootScope.$on('NEW_PLAYER', function(evt, payload) {
			createSector(payload.id);
		});
		$rootScope.$on('PLAYER_LEFT', function(evt, payload) {
			deleteSector(payload.id);
		});
		$rootScope.$on('PADDLE_MOVE', function(evt, payload) {
			gameObjSectors[payload.id].paddle.angle = payload.angle;
			gameObjSectors[payload.id].paddle.normalize();
		});

		var ball = new gameObjBall();

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
					gameObjSectors[userId].paddle.moveClockwise();
				});
			} else if (event.which === 39) {
				//console.log("left");
				$scope.$apply(function() {
					gameObjSectors[userId].paddle.moveCounterClockwise();
				});
			}
		});
	}
]);