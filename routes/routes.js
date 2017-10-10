//configure our routes
mapApp.config(function($routeProvider) {
	$routeProvider
		.when('/', {
			//route for the home page
			templateUrl : 'views/home.html',
			controller : 'homeController'
		})
		.when('/home', {
			//route for the home page
			templateUrl : 'views/home.html',
			controller : 'homeController'
		})
		.when('/station', {
			//route for the to do list page
			templateUrl : 'views/station.html',
			controller : 'stationController'
		});
});