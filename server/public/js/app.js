var app = angular.module('pongApp', ['ngRoute' /* Module dependencies */ ]);

/****************************** ROUTING DECLARATIONS *************************/

app.config(function($routeProvider, $locationProvider) {
	$routeProvider.when("/", {
		templateUrl: "/views/problem.html"
	}).when("/:session/:user", {
		templateUrl: "/views/game.html",
		controller: 'GameCtrl'
	}).otherwise({
		redirectTo: "/"
	});

	$locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
});
