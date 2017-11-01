
/*
 * This is the mainController which will be associated with the body of the index file as we will use this controller throughout all
 * "pages" for the header menu items and side panel menu and other details.
 */
mapApp.controller("mainController", function($scope, $http, $q, $timeout, $location, geolocationFactory, facebookFactory, sharedFactory, userFactory, validatorFactory, stationFactory){

    /* Define our scope variables */
	//the boolean variable "panelIsOpen" will initially be set to false as the side panel with initially be closed on page load
	$scope.panelIsOpen = false;

    //The default page transition effect will be that the content of the view will move from right to left
    //So set our scope variable of leftToRight to false.
    //This will be set to true any time we press the back button.
    $scope.leftToRight = false;

	//userDetails should be stored in the mainController scope
    $scope.userDetails = userFactory.userService.userDetails;


    //not sure we need to add this to scope yet as we are only using it with google maps.
    $scope.allStationsMapData = stationFactory.stationService.allStationsMapData;

    /* Define our functions */

    /*
     * Create an IIFE (so that it executes whenever our controller is loaded) to check if there is a userToken stored in local storage.
     * This will be invoked on a phonegap app if the app is opened from its icon and it has not been idle (i.e does not exist in the background)
     * If the app has been in a state of 'paused' (a phonegap event) then this will not execute on 'resume' (only when the scripts are initially loaded)
     */
    (function() {
       // "use strict";
       // alert('anonymous function');
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
           $scope.prepareHomeView();
        }
    });

    $scope.prepareHomeView = function(){
        /*
         * This function prepares the home view i.e prepares the google map with pinpoints of all stations. 
         * We will call this method anytime the home view has finished loading so that the div with id of map will be in the DOM.
         */
        if(stationFactory.stationService.allStationsMapData.length === 0){
            console.log("length " + stationFactory.stationService.allStationsMapData.length);
                //The allStationsMapData array is not populated therefore we need to do an API call (i.e call the getAllStationsMapData() method)
                //to retrieve the data from the database.
                stationFactory.stationService.getAllStationsMapData().then(function(allStationsMapData) {
                    if(allStationsMapData !== null){
                        // $scope.allStationsMapData =  allStationsMapData;
                        //prepare the google map with station data
                        stationFactory.stationService.prepareStationsOnMap(allStationsMapData, $scope, $location);
                    }else{
                        //There has been an error when retrieving all the stations data
                    }
                });
        }else{
            console.log("length " + stationFactory.stationService.allStationsMapData.length);
            //the allStationsMapData array is populated so the API call was already made to retrieve the allStationsMapData 
            //from the database so we just need to get the array data from our stationService now.
            var allStationsMapData = stationFactory.stationService.allStationsMapData;
            //prepare the google map with station data
            stationFactory.stationService.prepareStationsOnMap(allStationsMapData, $scope, $location);
        }
    }

    $scope.checkLocationPath = function(locationPath){
        /*
         * This function takes in the name of a path i.e login or home and checks if we are currently on that path or not.
         * Return true if we are on that path and false if not.
         */
        $scope.currentLocation = $location.path();
        console.log("view " + $scope.currentLocation);
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
         * This function checks if we are on the login view.
         * We will use this in the index.html page with ng-show in order to hide the header when we are on the login view.
         */
        var isLoginPath = $scope.checkLocationPath("login");
        return isLoginPath;
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

    $scope.loginWithFacebook = function(){
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

                    $scope.currentLocation = $location.path();

                    if($scope.currentLocation.indexOf("login") != -1){
                       //we are on the login view so redirect to the home page. 
                       //Otherwise do not redirect because we might be calling this login function when the user wants to write a review
                       $location.path('home');
                    }
                }else{
                    alert("We're sorry but you have not been logged in successfully. Please contact support!");
                    //if userDetails is null then login was not successful 
                    deferred.resolve(loginIsSuccessful);  
                }
            });
        }else{
            $scope.currentLocation = $location.path();

            if($scope.currentLocation.indexOf("login") != -1){
                //we are on the login view so redirect to the home page. 
                //Otherwise do not redirect because we might be calling this login function when the user wants to write a review
                $location.path('home');
            }
        }
        return deferred.promise;
    };



    $scope.loginWithFacebook1 = function(){
        var loginIsSuccessful = false; //initialize a boolean to false
        var deferred = $q.defer();
        //the following blocks of code should be moved to the facebookFactory when using phonegap
        var facebookUserID = "10213718552600000"; //"10213718552614326";
        var facebookName ="Admin user";//"La Monquesa Azul";
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
                    $scope.currentLocation = $location.path();

                    if($scope.currentLocation.indexOf("login") != -1){
                       //we are on the login view so redirect to the home page. 
                       //Otherwise do not redirect because we might be calling this login function when the user wants to write a review
                       $location.path('home');
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



