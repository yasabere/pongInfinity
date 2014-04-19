app.controller('GameCtrl', function($scope, $routeParams, SocketSvc) {
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
		});
		SocketSvc.on('playerLeave', function(payload){
			var vacantSpace = $scope.state[payload.playerIndex].size;
			$scope.state.splice(payload.playerIndex, 1);
			var multiplier = (360.0 / (360.0 - vacantSpace)); 
			for (var i = 0; i < $scope.state.length; i++) {
				$scope.state[i].size *= multiplier;
				$scope.state[i].paddlePosition *= multiplier;
			}
			console.log('leave', $scope.state);
		});
	};
	
	$(document).ready(function() {
		var logo = $("#logo");
		logo.delay(2000).animate({
			top: '200px',
			zoom: '0.25'
		}, 1500);

		var circle = $("#circle");
		circle.delay(2000).animate({
			width: '750px',
			height: '750px',
			marginTop: '-375px',
			marginLeft: '-375px'
		}, 1500);

		$("#circle-outline").delay(3500).fadeTo(500, 1);
		$("#footer").delay(3500).fadeTo(1000, 1);
	});

	$(window).resize(function() {
		var width = Math.min(750, $(window).width() - 200);
		var height = Math.min(750, $(window).height() - 200);
		var size = Math.min(width, height);
		$("#circle").css("width", size);
		$("#circle").css("height", size);
		$("#circle").css("margin-left", -size / 2);
		$("#circle").css("margin-top", -size / 2);

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
	});

	var addScore = function(color, score) {
		var scoreItem = $('<div></div>');
		scoreItem.attr("class", "score-item");
		scoreItem.css("background-color", color);

		var scoreText = $('<p>' + score + '</p>');
		scoreItem.append(scoreText);

		$("#scoreboard").append(scoreItem);
	};
});