
/*
 * This is the mainController which will be associated with the body of the index file as we will use this controller throughout all
 * "pages" for the header menu items and side panel menu and other details.
 */
mapApp.controller("mainController", function($scope, $compile, $window, $http, $q, $timeout, $location, geolocationFactory, facebookFactory, sharedFactory, userFactory, validatorFactory, stationFactory){
    "use strict";
    /* Define our scope variables */
	//the boolean variable "panelIsOpen" will initially be set to false as the side panel with initially be closed on page load
	$scope.panelIsOpen = false;

    //The default page transition effect will be that the content of the view will move from right to left
    //So set our scope variable of leftToRight to false.
    //This will be set to true any time we press the back button.
    $scope.leftToRight = false;

	//userDetails should be stored in the mainController scope
    $scope.userDetails = userFactory.userService.userDetails;

    $scope.bottomPanelIsShowing = false;
    //add the allStationsMapData to scope (we will use in the directions form destination select menu.)
    $scope.allStationsMapData = stationFactory.stationService.allStationsMapData;
    $scope.directionsFormData = {};
    $scope.directionsFormData.travelMode = 'DRIVING';
    $scope.directionsFormData.selectedFromLocation = 'chooseLocation';


    $scope.currentLocationIsloading = false;

    //Create a scope variable called mapIsLoading.
    //We will use this in the index.html doc in order to display a loading symbol to the user 
    //when the google map is being loaded.
    $scope.mapIsLoading = false;

    //Create a scope variable called mapLoadedSuccessfully.
    //We will use this in the index.html doc in order to display an error to the user 
    //if the google map has not loaded correctly.
    //Initialize it to true so that the error doesnt display before the map tries to load
    $scope.mapLoadedSuccessfully = true;

    window.onload = function(){
        /*
         * This will execute when the window is loaded. i.e all images, css files, scripts etc are loaded.
         * Therefore the google maps script will be loaded now and also the div with id of "map" 
         * so we can initialize the map
         */
       // $scope.initializeMap();
        if(localStorage.getItem("userToken") === null){
            //If there is no userToken in local storage, then we will not want the userDetails object to have any user Details.
            //So reset the userDetails object.
            //This covers such a case where the user has deleted their local storage manually but the userDetails object still exists with their data.
            userFactory.userService.resetUserDetails();
        }else{
            //userToken key exists in local storage so check this token on the server side to make sure its valid.
            var data = {
                "userToken" : userFactory.userService.getUserToken()
             };
            userFactory.userService.checkUserToken(data).then(function(userDetails) {
                //Since the checkUserToken method (in the userFactory) is performaing a http request we need to use a promise
                //to store the userDetails (from the response) into our $scope.userDetails variable. 
                $scope.userDetails = userDetails;
            });
        }
    };
 

    /*
     * Create an IIFE (so that it executes whenever our controller is loaded) to check if there is a userToken stored in local storage.
     * This will be invoked on a phonegap app if the app is opened from its icon and it has not been idle (i.e does not exist in the background)
     * If the app has been in a state of 'paused' (a phonegap event) then this will not execute on 'resume' (only when the scripts are initially loaded)
     */
    (function() {

       // if(localStorage.getItem("userToken") === null){
            //If there is no userToken in local storage, then we will not want the userDetails object to have any user Details.
            //So reset the userDetails object.
            //This covers such a case where the user has deleted their local storage manually but the userDetails object still exists with their data.
       //     userFactory.userService.resetUserDetails();
       // }else{
            //userToken key exists in local storage so check this token on the server side to make sure its valid.
        //    var data = {
        //        "userToken" : userFactory.userService.getUserToken()
        //     };
        //    userFactory.userService.checkUserToken(data).then(function(userDetails) {
                //Since the checkUserToken method (in the userFactory) is performaing a http request we need to use a promise
                //to store the userDetails (from the response) into our $scope.userDetails variable. 
        //        $scope.userDetails = userDetails;
        //    });
        //}
    })();



    $scope.$on('$viewContentLoaded', function(){
        /*
         * This will be executed whenever a view has finished loading. 
         * We will need to detect when the home view has finished loading as we will need to target the div with id of map
         * in the DOM (for google maps)
         */

        //Check if the current path is home 

        var isHomePath = $scope.checkLocationPath("home");
        if(isHomePath){ 
            //therefore prepare the Home view with google maps
            //$scope.initializeMap();
            console.log('home view loaded');
        }
    });

    $scope.$on('$routeChangeSuccess', function($event, next, current) { 
        /*
         * This will be executed whenever a route has changed successfully. 
         *
         */
        //scroll to the top of our container_wrapper so that the content of the new view will start from
        //the top of the screen.  
        var container_wrapper = document.getElementById('container_wrapper');
        container_wrapper.scrollTop = 0;
        var currentRoute = next.originalPath;
        if(currentRoute === "/home"){
            //We have navigated to the home view so prepare the google map
            $scope.initializeMap();
            console.log("yes home");
        }
    });

    $scope.initializeMap = function(){ 
        /*
         * In this method we prepare the google map (i.e the div with id of "map" in index.html) with pinpoints of all stations. 
         * We put the map element in the index.html page so that we only have to prepare it with stations when the app is opened.
         */

        if($scope.checkIfMapIsEmpty()){
            //The "map" element is empty so therefore the google map has not been loaded previously 
            //so we need to prepare it now with the station data.
            //Firstly set our scope variable mapIsLoading to true so that we can display a loading symbol to the user.

            $scope.mapIsLoading = true;

          //  alert("map is empty");
            //before preparing the google map we check if the API is loaded (with prepareGoogleMapsApi)
            //as the user may have not been online when the app was opened initially 
            //and therefore the google map script mightn't have loaded.
            //If we don't do this, then the google object will not be defined 
            //and this error will break the app in subsequent processes

            stationFactory.stationService.prepareGoogleMapsApi(function() {
                //prepareGoogleMapsApi takes in a callback function which will be executed if the Google Maps API has loaded successfully
                mapsApiIsLoaded = true;
                //we need to do an API call (i.e call the getAllStationsMapData() method) to retrieve the data from the database.
                //and also prepare the map
                stationFactory.stationService.getAllStationsMapData().then(function(allStationsMapData) {
                    if(allStationsMapData !== null){
                        $scope.allStationsMapData =  allStationsMapData;
                        //prepare the google map
                        stationFactory.stationService.prepareStationsOnMap(allStationsMapData, $scope, $location).then(function(mapLoadedSuccessfully) {
                          //  alert("mapLoadedSuccessfully " +  mapLoadedSuccessfully);
                            //mapLoadedSuccessfully will be true if the process was successful and false if not successful.

                            $scope.mapLoadedSuccessfully = mapLoadedSuccessfully;
                            $scope.mapIsLoading = false;
                        });


                        //get the users current location and mark it on the map.
                        stationFactory.stationService.prepareCurrentLocation().then(function(currentPosition) {
                            if(currentPosition !== null){
                                //change the "From" select menu of the directions form to currentLocation as we have detected a current location successfully
                                $scope.directionsFormData.selectedFromLocation = 'currentLocation';
                            }else{
                               //change the "From" select menu of the directions form to chooseLocation as we have NOT detected a current location successfully
                               $scope.directionsFormData.selectedFromLocation = 'chooseLocation';
                            }
                             console.log(" currentPosition  " +  JSON.stringify(currentPosition));
                        });

                    }else{
 
                    //There has been an error when retrieving all the stations data so set our boolean mapLoadedSuccessfully to false
                    //so that an error can be displayed in place of the map
                    $scope.mapLoadedSuccessfully = false;
                   // alert("$scope.mapLoadedSuccessfully " +  $scope.mapLoadedSuccessfully);
                    $scope.mapIsLoading = false;

                    }
                });
            }).then(function(mapLoadedSuccessfully) {
                //The promise will be resolved if we have detected there was no internet connection 
                //and therefore the Google Maps API (i.e the maps.google.com script could not be loaded again).
                $scope.mapLoadedSuccessfully = mapLoadedSuccessfully;
                $scope.mapIsLoading = false;
              //  alert("prepareGoogleMapsApi " +  $scope.mapLoadedSuccessfully);

            });  
        }else{
            //The "map" element is full so therefore the google map has already been prepared previously so 
            //no need to prepare it again.
          //  alert("map is full");
           // alert("$scope.mapLoadedSuccessfully " +  $scope.mapLoadedSuccessfully);
            //change $scope.mapLoadedSuccessfully to true so the "Error loading map" disappears (if it was shown) in the html
            $scope.mapLoadedSuccessfully = true;
           // alert("$scope.mapLoadedSuccessfully2 " +  $scope.mapLoadedSuccessfully);
        }

    };


    $scope.refreshMap = function(){
      //  alert("refresh map");
        $scope.initializeMap();

    };

    $scope.showGetDirectionsForm = function(){ 
     
        if($scope.bottomPanelIsShowing == false){
            $scope.bottomPanelIsShowing = true;
        }else if($scope.bottomPanelIsShowing == true){
            $scope.bottomPanelIsShowing = false;
        }
    };


    $scope.getDirections = function(stationID){ 
        /*
         * This method is called when the "get directions" button is clicked from the google map info window.
         * We take in the stationID of the destination so that we can add it to the model of our directions form.
         * i.e the $scope.directionsFormData.selectedDestination property.
         * When the form is submitted we will use the destinationStationID passed through the select menu to get the lat and lng points
         */
        //empty the directions panel from the last time directions were output.
        document.getElementById("directions_panel").innerHTML = "";
        $scope.bottomPanelIsShowing = true;
        $scope.directionsFormData.selectedDestination = "" + stationID; //store it as a string  
    };


    $scope.checkIfDirectionsAreEmpty = function(){ 
        /*
         */

        var panelIsEmpty = document.getElementById('directions_panel').innerHTML === "";
        return panelIsEmpty;
        console.log("panelIsEmpty " + panelIsEmpty);
    };

    $scope.checkIfMapIsEmpty = function(){ 
        /*
         * This method checks if the element with id of "map" is empty.
         * It will return true if empty and false if not.
         * We will use this in initializeMap method to determine whether to create the google map or not.
         */

        var mapIsEmpty = document.getElementById('map').innerHTML === "";
        return mapIsEmpty;
    };

    $scope.selectFromLocation = function(selectedFromLocation){ 
        /*
         * This method is called (with ng-change) when a user chooses a "from location" of either "current location" or "choose start location" from the select menu 
         * If a user chooses from "current location" we need to check if geolocation is working on their device in order to get the current position.
         * For this we call the prepareCurrentLocation from the factory.
         */
        $scope.directionsFormData.selectedFromLocation = 'chooseLocation';

        console.log("selectedFromLocation "+ selectedFromLocation);
        console.log("$scope.directionsFormData.selectedFromLocation "+ $scope.directionsFormData.selectedFromLocation);
        if(selectedFromLocation === 'currentLocation'){
            $scope.currentLocationIsloading = true;
            //if the user selects current location we should get the current location again as it may have changed.
            stationFactory.stationService.prepareCurrentLocation().then(function(currentPosition) {
                //set the $scope.currentLocationIsloading to false as promised has resolved.
                $scope.currentLocationIsloading = false;
                if(currentPosition !== null){
                    //we were able to get the users current position
                    $scope.directionsFormData.selectedFromLocation = 'currentLocation';
                }else{

                    //if the current position is null then we need to switch the select menu back to "choose a start location"
                    //we do this as follows:
                    $scope.directionsFormData.selectedFromLocation = 'chooseLocation';
                    alert("We're sorry but your current location is inaccessible. " +
                        "Please ensure location services are enabled in the settings on your device or enter a start location in the form.");
                }
            });
        }else{
            console.log("else $scope.directionsFormData.selectedFromLocation "+ $scope.directionsFormData.selectedFromLocation);
             $scope.directionsFormData.selectedFromLocation = 'chooseLocation';
        }
    };

    $scope.selectDestination = function(){
        //ng-change calls this function when select menu changes but we might not need it
        console.log("$scope.directionsFormData.selectedDestination" + $scope.directionsFormData.selectedDestination);
    };


    $scope.submitGetDirectionsForm = function(){ 
       // alert('submit directions');
        if($scope.directionsFormData.selectedFromLocation == 'chooseLocation' && $scope.directionsFormData.startLocation == null){
            //the form has been submitted but the input field for the user to type the "from location" is empty 
            //so exit the function. There will already be an error message displayed in the form
            alert('choose location error');
            return;
        }
        console.log("$scope.directionsFormData.selectedDestination" + $scope.directionsFormData.selectedDestination);

        var startLocation;
        var destinationStationID = $scope.directionsFormData.selectedDestination;
        var viaPoint = $scope.directionsFormData.viaPoint;
        var travelMode = $scope.directionsFormData.travelMode;

        stationFactory.stationService.prepareGoogleMapsApi(function() {
        mapsApiIsLoaded = true;
        if($scope.directionsFormData.selectedFromLocation == 'currentLocation'){
            // alert('selected current location');
            //we should retrieve the updated current position in case the user has moved position since
            //beginning to fill in the form.
            stationFactory.stationService.prepareCurrentLocation().then(function(currentPosition) {
              //  alert('prepare current location promise finished');
                if(currentPosition !== null){
                    //we were able to get the users current position
                    //store the currentPosition in our startLocation variable to pass into our getDirections method
                    startLocation = currentPosition;

                 //   alert(" currentPosition  is not null" +  JSON.stringify(currentPosition));
                    //pass in start, via and travel mode.
                    stationFactory.stationService.getDirections(startLocation, viaPoint, travelMode, destinationStationID);
                }else{
                    //if the current position is null then we cant allow the form to be submitted.
                    //stop processing the form and output an error to the user telling them to enter a start location
                    alert("We're sorry but your current location is inaccessible. " +
                        "Please ensure location services are enabled in the settings on your device or enter a start location in the form.");
                    $scope.directionsFormData.selectedFromLocation = 'chooseLocation';
          
                    return;
                }
            });

        }else{
           // alert('selected choose location');
            //User has selected to choose a start location in the form so get the input from the startLocation form field
            startLocation = $scope.directionsFormData.startLocation;
            //pass in start, via and travel mode.
            stationFactory.stationService.getDirections(startLocation, viaPoint, travelMode, destinationStationID);
        }
        });
    };



    $scope.checkLocationPath = function(locationPath){
        /*
         * This function takes in the name of a path i.e login or home and checks if we are currently on that path or not.
         * Return true if we are on that path and false if not.
         */
        $scope.currentLocation = $location.path();
        //Check if the current path is the locationPath we took in as a parameter. 
        if($scope.currentLocation.indexOf(locationPath) !== -1){
            //This is the locationPath
            return true;
        }else{
            return false;
        }
    }


    $scope.detectLoginView = function(){
        /*
         * This function checks if we are on the login view. i.e the path is either "/ or contains "login"
         * We will use this in the index.html page with ng-show in order to hide the header when we are on the login view.
         */
        var isIndexRoute;
        if($location.path() === "/"){
            //check if the path just contains a / 
            isIndexRoute = true;
        } 
        var isLoginPath = $scope.checkLocationPath("login") || isIndexRoute;
        return isLoginPath;
    }

    $scope.detectHomeView = function(){
        /*
         * This function checks if we are on the home view.
         */
        var isHomePath = $scope.checkLocationPath("home");
        return isHomePath;
    }


	$scope.toggleSidePanel = function(){
		/*
         * This function checks if the boolean variable "panelIsOpen" is currently true or false.
		 * if it is false when the user presses the toggle button it means the panel is currently closed so therefore 
		 * we should open it now and then set panelIsOpen to true. 
		 * In our html we use the ng-class directive to add the swipe_left class when panelIsOpen is true.
         */
		if($scope.panelIsOpen == false){
			$scope.panelIsOpen = true;
		}else if($scope.panelIsOpen == true){
			$scope.panelIsOpen = false;
		}
	}

	$scope.goToExternalLink = function(event){

        console.log('external');
		event.preventDefault();
		var href = event.target.attributes['href'].value; //get the href attribute of this element
        var ref = window.open(href, '_blank', 'location=yes');
	}



	$scope.goBack = function() {
        /*
         * This function is called when the back arrow is pressed in order to go back in history.
         * We also want the page to transition backwards i.e from left to right so the UX is smoother
         */
        window.history.back();
        $scope.transitionFromLeftToRight();
    }

    $scope.transitionFromLeftToRight = function() {
        /*
         * This function is called in the goBack method in order to transition the page backwards i.e from left to right 
         * it is also called when a menu item from the right panel is clicked (selectMenuItem()) so that the page 
         * slides in along with the container_wrapper closing in from the left.
         */
		$scope.leftToRight = true; //CSS styling (e.g CSS3 transitions) is applied to the ng-view element in the index.html page when this is set to true 
        $timeout(function() {
            //wait 300ms (or other) (i.e until the page transition is finished) to set the transition direction back to default value.
            $scope.leftToRight = false;
        }, 300);
    }

	$scope.selectMenuItem = function($index){
		/*
         * This function is called whenever a menu item is clicked. It takes in the index of the current list item.
		 * In our index.html we use the ng-class directive to add the "current" class to a list item whenever the condition $index == selectedItem is true.
		 * The "current" class adds some CSS styling to the selected item to show the user which menu item is currently selected.
		 */
        $scope.selectedItem = $index; 
		//Also when a side menu item is selected we would like the new page to move in from the left, so that it transitions
		//more smoothly with the side panel as it's closing. 
		$scope.transitionFromLeftToRight();
	}

    $scope.loginWithFacebook1 = function(){
        /*
         * This function calls the login method of the userFactory.userService and returns the user's profile data.
         * This method will be called when the "login with facebook" button is pressed and also when the 
         * "write a review" button is pressed if it is detected that the user is not logged in.
         * In the case where it is called from "write a review" then we need to return a promise so that we can display the review from after
         * the processing is successful
         */ 
        var loginIsSuccessful = false; //initialize a boolean to false
        var deferred = $q.defer();

        if(userFactory.userService.userDetails.isLoggedIn === false){
            userFactory.userService.login().then(function(userDetails) {
                //Store the userDetails (from the response of the http request) into our $scope.userDetails variable. 

                if(userDetails !== null){ 
                    //if userDetails is not null then login was successful 
                    loginIsSuccessful = true;
                    deferred.resolve(loginIsSuccessful);    
                    $scope.userDetails = userDetails;


                    if($scope.detectLoginView()){
                       //we are on the login view so redirect to the home page. 
                       //Otherwise do not redirect because we might be calling this login function when the user wants to write a review
                       $location.path('home');
                       console.log("redirect to home");
                    }
                }else{
                    alert("We're sorry but you have not been logged in successfully. Please contact support!");
                    //if userDetails is null then login was not successful 
                    deferred.resolve(loginIsSuccessful);  
                }
            });
        }else{

            if($scope.detectLoginView()){
                //we are on the login view so redirect to the home page. 
                //Otherwise do not redirect because we might be calling this login function when the user wants to write a review
                $location.path('home');
            }
        }
        return deferred.promise;
    };



    $scope.loginWithFacebook = function(){
        var loginIsSuccessful = false; //initialize a boolean to false
        var deferred = $q.defer();
        //the following blocks of code should be moved to the facebookFactory when using phonegap
        var facebookUserID = "10213718552614326";//"10213718552600000";
        var facebookName ="La Monquesa Azul";//"Admin user";
        var profilePicURL = "https://graph.facebook.com/10213718552614326/picture?type=large&w??idth=200&height=200";

        var inputsAreValid = validatorFactory.validateFacebookInputs(
            [{"input" : facebookUserID, "minLength" : 1, "maxLength" : 30, "regex" : /^\d+$/},
             {"input" : facebookName, "minLength" : 1, "maxLength" : 60},
             {"input" : profilePicURL, "minLength" : 1, "maxLength" : 250}]);

        console.log("inputsAreValid " + inputsAreValid);

        if(inputsAreValid){
            //After inputs are checked for validity then we call the checkLoginDetails method to perform the http request to the server side
            var data = {
                "facebookUserID" : facebookUserID, 
                "facebookName" : facebookName, 
                //"profilePicURL" : "https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/21617751_10213716829451248_7798041643913998634_n.jpg?oh=7242e13b731a211fa7ac77ed443ec96f&oe=5A483F35"
                "profilePicURL" : profilePicURL
            };

            userFactory.userService.checkLoginDetails(data).then(function(userDetails) {
                //Since the checkLoginDetails method (in the loginFactory) is performaing a http request we need to use a promise
                //to store the userDetails (from the response) into our $scope.userDetails variable. 
               
                if(userDetails !== null){ 
                    loginIsSuccessful = true;
                    deferred.resolve(loginIsSuccessful);      
                    $scope.userDetails = userDetails;

                    if($scope.detectLoginView()){
                        //we are on the login view so redirect to the home page. 
                        //Otherwise do not redirect because we might be calling this login function when the user wants to write a review
                        $location.path('home');
                        console.log("redirect to home");
                    }
                }else{
                    alert("We're sorry but you have not been logged in successfully. Please contact support!");
                    //if login was not successful then do not redirect 
                    deferred.resolve(loginIsSuccessful);  
                }

            });
        }
        return deferred.promise;

    }  


    $scope.goToStation = function(){
   
           // stationFactory.getStationDetails(1); 

    }


    $scope.logOut = function(){
        /*
         * This method is called when the logout button is pressed.
         * The logout button will only be present in the view if the user is currently logged in (using ng-show) 
         * so we don't need to check if they are logged in here.
         */
    	var confirmation = confirm("Are you sure you want to log out?");
	    if(confirmation){
            //reset the userDetails object to default values.
            userFactory.userService.resetUserDetails(); 
            //clear the userToken from local storage.
            localStorage.clear();
            $location.path('login');
            //log out of facebook
            facebookFactory.logOutOfFacebook();
        }

    }
 
    $scope.checkIfLoggedIn = function(){
        /*
         * This method calls the checkIfUserIsLoggedIn() of the userFactory.userService
         * and returns a boolean value.
         * We use this along with ng-show in our view to show html elements depending on the users logged in status.
         */
        var isLoggedIn = userFactory.userService.checkIfUserIsLoggedIn();
        return isLoggedIn;

    }  
    $scope.showUserProfileArea = function(){
        /*
         * We only want to show the user profile area if we're currently not on the login page and also if the user is logged in.
         */
       // var userProfileIsShowing = false;

        if(!$scope.detectLoginView() && $scope.checkIfLoggedIn()){
            return true;
        }else{
            return false;
        }
    }  



    $scope.checkIfUserIsAdmin = function(){
        /*
         * This method calls the checkIfUserIsLoggedIn() of the userFactory.userService
         * and returns a boolean value.
         * We use this along with ng-show in our view to show html elements depending on whether the user is an administrator.
         */
	    var isAdmin = userFactory.userService.checkIfUserIsAdmin(); 
        return isAdmin; 
    } 


});



