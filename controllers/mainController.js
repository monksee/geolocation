
//create the mainController which will be associated with the body of the index file as we will use this controller throughout all
//"pages" for the header menu items and side panel menu.
mapApp.controller("mainController", function($scope, $http, $timeout, geolocationFactory, facebookFactory, loginFactory, sharedFactory, userFactory, validatorFactory, stationFactory){

	//the boolean variable "panelIsOpen" will initially be set to false as the side panel with initially be closed on page load
	var panelIsOpen = false;


    //The default page transition effect will be that the content of the view will move from left to right
    //So set our scope variable of leftToRight to true
    $scope.leftToRight = false;

	//add the panelIsOpen boolean variable to scope
	$scope.panelIsOpen = panelIsOpen;
	//userDetails should be stored in the mainController scope becuas 
	$scope.userDetails = userFactory.userService.userDetails;
	$scope.toggleSidePanel = function(){
		//this function checks if the boolean variable "panelIsOpen" is currently true or false.
		//if it is false when the user presses the toggle button it means the panel is currently closed so therefore 
		//we should open it now. and then set panelIsOpen to true. 
		//in our html we use the ng-class directive to add the swipe_left class when panelIsOpen is true.

		if($scope.panelIsOpen == false){
			$scope.panelIsOpen = true;
		}else if($scope.panelIsOpen == true){

			$scope.panelIsOpen = false;
		}
	}
	$scope.goToExternalLink = function(event){
        console.log('external');
		event.preventDefault();
		var href = event.target.attributes['href'].value; // 345
        //var href = $(this).attr('href');
        var ref = window.open(href, '_blank', 'location=yes');
	}
	$scope.goBack = function() {
		//Set the leftToRight variable to false so our page transition goes from right to left
        window.history.back();
        $scope.transitionFromLeftToRight();
    }

    $scope.transitionFromLeftToRight = function() {
		//Set the leftToRight variable to true so our page transition goes from left to right
		$scope.leftToRight = true;
        $timeout(function() {
            //wait 300ms (i.e until the page transition is finished) to set the transition direction back to default value.
            $scope.leftToRight = false;
        }, 300);
    }
	$scope.selectMenuItem = function($index){
		//this function is called whenever a menu item is clicked. It takes in the index of the current list item
		//in our html we use the ng-class directive to add the "current" class to a list item whenever the condition $index == selectedItem is true.
		//the "current" class adds some css styling to the selected item to show the user which menu item is currently selected.
		$scope.selectedItem = $index; 
		//When a side menu item is selected we would like the new page to transition in from the left so that it transitions
		//more smoothly with the side panel as it's closing. 
		$scope.transitionFromLeftToRight();
	}


    geolocationFactory.getCurrentPosition(function (position) {
    alert('Latitude: '              + position.coords.latitude          + '\n' +
          'Longitude: '             + position.coords.longitude         + '\n' +
          'Altitude: '              + position.coords.altitude          + '\n' +
          'Accuracy: '              + position.coords.accuracy          + '\n' +
          'Altitude Accuracy: '     + position.coords.altitudeAccuracy  + '\n' +
          'Heading: '               + position.coords.heading           + '\n' +
          'Speed: '                 + position.coords.speed             + '\n' +
          'Timestamp: '             + position.timestamp                + '\n');
    });

    (function() {

   // $scope.anonymousFunction = function(){
   
    	//Anonymous function to be run when app opens.
    	if(localStorage.getItem("userToken") === null){
    		//If there is no userToken in local storage, then we will not want the userDetails object to have any user Details.
    		//So reset the userDetails object.
    		//This covers such a case where the user has deleted their local storage manually but the userDetails object still exists with their data.

            userFactory.userService.resetUserDetails();

        }else{
        	//userToken key exists in local storage so check this token on the server side to make sure its valid.
            var data = {
        	    "userToken" : localStorage.getItem("userToken")
               // "userToken" : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjMxLCJmYWNlYm9va1VzZXJJRCI6IjEwMjEzNzE4NTUyNjE0MzI2In0.SdWuJQ8uvAt4neH6Pxr0zzh_TRB5un2rKWYQHfo2fpo"
            };
            loginFactory.checkUserToken(data).then(function(userDetails) {
    	        //Since the checkUserToken method (in the loginFactory) is performaing a http request we need to use a promise
    	        //to store the userDetails (from the response) into our $scope.userDetails variable. 
      	        $scope.userDetails = userDetails;
     	        console.log("$scope.userDetails" + JSON.stringify($scope.userDetails));
            });
        }
    })();
//}


    $scope.loginWithFacebook = function(){
	    facebookFactory.processFacebookLogin(function (response) { alert('here' + JSON.stringify(response)); });
	    //the following blocks of code should be moved to the facebookFactory when using phonegap
        var facebookUserID = "10213718552614326";
        var facebookName = "La Monquesa Azul";
        var profilePicURL = "https://graph.facebook.com/10213718552614326/picture?type=large&w‌​idth=200&height=200";

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
       // console.log("islogged" + userFactory.userService.checkIfUserIsLoggedIn());
        var isLoggedIn = userFactory.userService.checkIfUserIsLoggedIn();
        return isLoggedIn;

    }  

    $scope.checkIfUserIsAdmin = function(){
	    var isAdmin = userFactory.userService.checkIfUserIsAdmin(); 
        return isAdmin; 
    } 

});



