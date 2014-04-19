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
});