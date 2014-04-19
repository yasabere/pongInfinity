var app = angular.module('pongApp', ['ngRoute' /* Module dependencies */ ]);

/****************************** ROUTING DECLARATIONS *************************/

app.config(function($routeProvider, $locationProvider) {
	$routeProvider.when("/", {
		templateUrl: "/views/problem.html"
	}).when("/:session/:user", {
		templateUrl: "/views/game.html",
		controller: 'GameCtrl'
	}).when("/pong", {
		templateUrl: "/views/pongStage.html",
		controller: "PongStage"
	}).otherwise({
		redirectTo: "/"
	});

	$locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
});
