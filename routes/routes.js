//configure our routes
mapApp.config(function($routeProvider) {
	$routeProvider
		.when('/', {
			//route for the home page
			templateUrl : 'views/home.html',
			controller : 'homeController'
		})
		.when('/map', {
			//route for the to do list page
			templateUrl : 'views/map.html',
			controller : 'mapController'
		});
});