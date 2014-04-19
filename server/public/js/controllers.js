app.controller('PongStage', ['$scope', function($scope) {
	$scope.test = 'Hola!';

	//variables
	var radius = 100;

	var centerPoint = {
		x:200,
		y:100,
	};

	var stage = new createjs.Stage("demoCanvas");
	createjs.Ticker.addEventListener("tick", tick);

	var drawing_stage = new createjs.Shape();
	drawing_stage.graphics.beginFill("red").drawCircle(0, 0, 50);
	drawing_stage.x = 100;
	drawing_stage.y = 100;
	stage.addChild(drawing_stage);

	var drawing = new createjs.Shape();
	drawing.graphics.beginStroke('green')
	                .setStrokeStyle(radius).arc(0,0, radius/2, 0, Math.PI/2);

	drawing.x = centerPoint.x;
	drawing.y = centerPoint.y;
	stage.addChild(drawing);

	function tick(event) {    
	    drawing.rotation += 1;
	    stage.update();
	}
}]);