//create the homeController for the home.html view
mapApp.controller("homeController", function($scope){
	$scope.pageHeading = "Home"; //this will be inserted to a h2 tag
	$scope.introParagraph = "Welcome to the to do app. The easy way to keep track of your daily/weekly tasks!"
	
	$scope.selectMarker = function(){
		console.log('marker selected');
	}



});



