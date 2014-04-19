var app = angular.module('pongApp', ['ngRoute' /* Module dependencies */ ]);

/****************************** ROUTING DECLARATIONS *************************/

app.config(function($routeProvider, $locationProvider) {
	$routeProvider.when("/", {
		templateUrl: "/views/main.html"
	}).otherwise({
		redirectTo: "/"
	});

	$locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
});
