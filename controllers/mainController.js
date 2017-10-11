
/*
 * This is the mainController which will be associated with the body of the index file as we will use this controller throughout all
 * "pages" for the header menu items and side panel menu and other details.
 */
mapApp.controller("mainController", function($scope, $http, $timeout, geolocationFactory, facebookFactory, loginFactory, sharedFactory, userFactory, validatorFactory, stationFactory){

    /* Define our scope variables */
	//the boolean variable "panelIsOpen" will initially be set to false as the side panel with initially be closed on page load
	$scope.panelIsOpen = false;

    //The default page transition effect will be that the content of the view will move from right to left
    //So set our scope variable of leftToRight to false.
    //This will be set to true any time we press the back button.
    $scope.leftToRight = false;

	//userDetails should be stored in the mainController scope
	$scope.userDetails = userFactory.userService.userDetails;


    /* Define our functions */

    /*
     * Create an IIFE (so that it executes whenever our controller is loaded) to check if there is a userToken stored in local storage.
     * This will be invoked on a phonegap app if the app is opened from its icon and it has not been idle (i.e does not exist in the background)
     * If the app has been in a state of 'paused' (a phonegap event) then this will not execute on 'resume' (only when the scripts are initially loaded)
     */
    (function() {
        "use strict";
        alert('anonymous function');
        if(localStorage.getItem("userToken") === null){
            //If there is no userToken in local storage, then we will not want the userDetails object to have any user Details.
            //So reset the userDetails object.
            //This covers such a case where the user has deleted their local storage manually but the userDetails object still exists with their data.
            userFactory.userService.resetUserDetails();
        }else{
            //userToken key exists in local storage so check this token on the server side to make sure its valid.
            var data = {
                "userToken" : localStorage.getItem("userToken")
             };
            loginFactory.checkUserToken(data).then(function(userDetails) {
                //Since the checkUserToken method (in the loginFactory) is performaing a http request we need to use a promise
                //to store the userDetails (from the response) into our $scope.userDetails variable. 
                $scope.userDetails = userDetails;
                console.log("$scope.userDetails" + JSON.stringify($scope.userDetails));
            });
        }
    })();


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

    $scope.goBack1 = function(){
        //wanted to jsut check what the userDetails returns on the phone.

        alert(JSON.stringify(userFactory.userService.userDetails));
        geolocationFactory.getCurrentPosition(function (position) {
            alert('Latitude: '              + position.coords.latitude          + '\n' +
                  'Longitude: '             + position.coords.longitude         + '\n' +
                  'Altitude: '              + position.coords.altitude          + '\n' +
                  'Accuracy: '              + position.coords.accuracy          + '\n' +
                  'Altitude Accuracy: '     + position.coords.altitudeAccuracy  + '\n' +
                  'Heading: '               + position.coords.heading           + '\n' +
                  'Speed: '                 + position.coords.speed             + '\n' +
                  'Timestamp: '             + position.timestamp                + '\n'
            );
        });
    };

    $scope.loginWithFacebook1 = function(){
        /*
         * This function calls the processFacebookLogin() method from the facebookFactory.
         * The facebookFactory uses the facebookConnectPlugin (cordova-plugin-facebook4) in order to authenticate the 
         * users facebook login details and get their public profile data. 
         * Once authenticated, we validate the public profile data (in the facebookFactory) and then return it to the following function
         */
	    facebookFactory.processFacebookLogin().then(function(data) {
            if(data !== null){
                alert("Facebook userDetails" + JSON.stringify(data)); 
                loginFactory.checkLoginDetails(data).then(function(userDetails) {
    	            //Since the checkLoginDetails method (in the loginFactory) is performaing a http request we need to use a promise
    	            //to store the userDetails (from the response) into our $scope.userDetails variable. 
      	            $scope.userDetails = userDetails;
     	            console.log("$scope.userDetails" + JSON.stringify($scope.userDetails));
                });
            }else{
                //data is null therefore there was an error in facebookFactory of the facebook user details did not pass validation checks
                alert("data " + data); 
            }


        });

    };
    $scope.loginWithFacebook = function(){

        //the following blocks of code should be moved to the facebookFactory when using phonegap
        var facebookUserID = "10213718552614326";
        var facebookName = "La Monquesa Azul";
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

            loginFactory.checkLoginDetails(data).then(function(userDetails) {
                //Since the checkLoginDetails method (in the loginFactory) is performaing a http request we need to use a promise
                //to store the userDetails (from the response) into our $scope.userDetails variable. 
                $scope.userDetails = userDetails;
                console.log("$scope.userDetails" + JSON.stringify($scope.userDetails));
            });
        }


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



