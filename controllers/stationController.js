

//create the stationController for the station.html view
mapApp.controller("stationController", function($scope, $routeParams, $location, stationFactory){
	  $scope.pageHeading = "Station"; //this will be inserted to a h2 tag
	  $scope.introParagraph = "hi"

    $scope.stationDetails =  {};

	  if($routeParams.stationID == null || $routeParams.stationID === ""){
		    //If the stationID is not set or if it doesnt contain a value (i.e is the empty string) then redirect to the home page.
        //This will also return true if stationID is undefined. 
        console.log("stationID " + $routeParams.stationID);
		    $location.path('home'); 
    }else{ 
        stationFactory.stationService.getStationDetails($routeParams.stationID).then(function(stationDetails) {
            //if an error occurs in the http request (in the getStationDetails method of the stationFactory) we pass in null as the returned value from the promise
            //Therefore we can check now if the value of stationDetails is null and redirect to the home page if it is.

            if(stationDetails !== null){
                 //stationDetails returned from the promise is not null so we store them in scope.
      	        $scope.stationDetails = stationDetails;
            }else{
                //stationDetails value will be null if an error occurred in http request
                //redirect to home page.
                $location.path('home'); 
     	          
            }
        });
    }

});


