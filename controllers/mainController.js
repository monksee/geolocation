
//create the mainController which will be associated with the body of the index file as we will use this controller throughout all
//"pages" for the header menu items and side panel menu.
mapApp.controller("mainController", function($scope, $http, geolocationFactory, facebookFactory, loginFactory, sharedFactory){

	//the boolean variable "panelIsOpen" will initially be set to false as the side panel with initially be closed on page load
	var panelIsOpen = false;

	//create an array of objects storing information on our menu items for the header of all "pages"
	//store the relevant icons and hrefs for each menu item 
	var menuItems = [{'name':'Home', 'href': '#/', 'font_awesome_icon' : 'fa-home'}, 
			{'name': 'To Do List', 'href': '#station', 'font_awesome_icon' : 'fa-pencil'},
			{'name': 'Activity Log', 'href': '#history', 'font_awesome_icon' : 'fa-history'}];


	//add the menuItems array to scope
	$scope.menuItems = menuItems;
	//add the panelIsOpen boolean variable to scope
	$scope.panelIsOpen = panelIsOpen;
	//userDetails should be stored in the mainController scope becuas 
	$scope.userDetails = sharedFactory.userDetails;
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
	$scope.goBack = function() {
        window.history.back();
    }
	$scope.selectMenuItem = function($index){
		//this function is called whenever a menu item is clicked. It takes in the index of the current list item
		//in our html we use the ng-class directive to add the "current" class to a list item whenever the condition $index == selectedItem is true.
		//the "current" class adds some css styling to the selected item to show the user which menu item is currently selected.
		$scope.selectedItem = $index; 
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
    	//Anonymous function to be run when app opens.
    	if(localStorage.getItem("userToken") === null){


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



    $scope.loginWithFacebook = function(){
	    //facebookFactory.processFacebookLogin(function (response) {});
	    //the following two blocks of code should be moved to the facebookFactory when using phonegap
        var data = {
            "facebookUserID" : "10213718552614326", 
            "facebookName" : "La", 
            //"profilePicURL" : "https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/21617751_10213716829451248_7798041643913998634_n.jpg?oh=7242e13b731a211fa7ac77ed443ec96f&oe=5A483F35"
            "profilePicURL" : "https://graph.facebook.com/10213718552614326/picture?type=large&w‌​idth=200&height=200"
        };

        loginFactory.checkLoginDetails(data).then(function(userDetails) {
    	    //Since the checkLoginDetails method (in the loginFactory) is performaing a http request we need to use a promise
    	    //to store the userDetails (from the response) into our $scope.userDetails variable. 
      	    $scope.userDetails = userDetails;
     	    console.log("$scope.userDetails" + JSON.stringify($scope.userDetails));
        });
    }  
    $scope.logOut = function(){
    	var confirmation = confirm("Are you sure you want to log out?");

	    if(confirmation){
            sharedFactory.userService.resetUserDetails(); 
            localStorage.clear();
        }

    }

    $scope.checkIfLoggedIn = function(){
        return sharedFactory.userService.userDetails.isLoggedIn;
    }  

    $scope.checkIfUserIsAdmin = function(){
	    var isAdmin = sharedFactory.userService.checkIfUserIsAdmin(); 
        return isAdmin; 
    } 

});



