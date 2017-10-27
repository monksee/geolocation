

//create the stationController for the station.html view
mapApp.controller("stationController", function($scope, $routeParams, $location, stationFactory, userFactory, reviewFactory, validatorFactory, sharedFactory){


    $scope.stationDetails =  {};
    $scope.displayReviewForm = false;
    $scope.selectedStar = 0;
    $scope.dataIsSet = false;

	if($routeParams.stationID == null || $routeParams.stationID === ""){
		//If the stationID is not set or if it doesnt contain a value (i.e is the empty string) then redirect to the home page.
        //This will also return true if stationID is undefined. 
		$location.path('home'); 
    }else{ 
        stationFactory.stationService.getStationDetails($routeParams.stationID).then(function(stationDetails) {
            //if an error occurs in the http request (in the getStationDetails method of the stationFactory) we pass in null as the returned value from the promise
            //Therefore we can check now if the value of stationDetails is null and redirect to the home page if it is.

            if(stationDetails !== null){
                 //stationDetails returned from the promise is not null so we store them in scope.
      	        $scope.stationDetails = stationDetails;
                $scope.dataIsSet = true;
            }else{
                //stationDetails value will be null if an error occurred in http request
                //redirect to home page.
                $location.path('home'); 
     	          
            }
        });
    }

    $scope.checkForUserPrivileges = function(creatorUserID){
        /*
         * This method takes in the userID of the creator of a particular review or the reply of a review.
         * It checks if the current user is the creator of the review comment.
         * We use this along with ng-show in our station view to show the edit review button.
         */

        var currentUserID = userFactory.userService.userDetails.userID;
        if(currentUserID === creatorUserID){
            return true;
        }else{
            return false;
        }
    }; 
    $scope.checkForHigherUserPrivileges = function(creatorUserID){
        /*
         * This method takes in the userID of the creator of a particular review or the reply of a review.
         * It checks if the current user is an administrator or if the current user is the creator of the review or reply.
         * If either of these is true then we return true
         * We use this along with ng-show in our station view to show certain elements.
         */
        var currentUserID = userFactory.userService.userDetails.userID;
        var isAdmin = userFactory.userService.checkIfUserIsAdmin();
        if(isAdmin || (currentUserID === creatorUserID)){
            return true;
        }else{
            return false;
        }
    };
    $scope.checkForReviews = function(){
        /*
         * This method checks to see if there are any reviews for this station 
         */
        return stationFactory.stationService.checkForReviews();
    }; 
    $scope.checkUsersReviewStatus = function(){
        /*
         * This method checks to see if the current user has written a review for this station or not.
         * It returns a boolean.
         */
        return stationFactory.stationService.checkUsersReviewStatus();
    }; 

    $scope.displayWriteAReviewButton = function(){
        /*
         * This method checks to see if we should display (with ng-show) the "write a review" button or not.
         * We will show the button, if the review form is not currently displayed and also the user has not written 
         * a review for a particular station before.
         */
        if(!$scope.displayReviewForm && !$scope.checkUsersReviewStatus()){

            return true;
        }else{
            return false;
        }
    };

    $scope.writeAReview = function(){
        /*
         * This method is called when the "Write a review" button is clicked.
         * It firstly checks to see if a user is logged in. If they are logged in then we can show the review form.
         * Note: A user must be logged in before they can submit a review.
         */
        var isLoggedIn = userFactory.userService.checkIfUserIsLoggedIn();
        if(!isLoggedIn){
            //the user is not logged in so we show the facebook login dialog and do processing there.
            $scope.loginWithFacebook().then(function(loginIsSuccessful){
                console.log('t' + loginIsSuccessful);
                if(loginIsSuccessful){
                    //if login is successful then display the review form.
                    $scope.displayReviewForm = true;
                }
            });
        }else{
            $scope.displayReviewForm = true;
        }

    }; 

    $scope.selectStar = function(rating){
        /*
         * This method is called when a star (with the review form stars) is clicked i.e a rating is selected.
         * The value passed in to this function will be 1 to 5 inclusive.
         */
        $scope.selectedStar = rating;
    };


    $scope.submitReview = function(stationID, userID){
        /*
         * This method is called when the review from is submitted
         * The review form will only be visible if a user has logged in so no need to check if user is logged in here.
         */
        if($scope.review == null || sharedFactory.checkIfEmptyObject($scope.review.text)){
           //If $scope.review (our ng-model variable) is undefined or the text object is empty 
           //it means there is no text in the textarea so break out of the function.
           //There will be an error message displayed in the form already so no need to output error here.
           return;
        }
        
        var reviewText = $scope.review.text; //our ng-model variable
        var rating = $scope.selectedStar; 
        var userToken = userFactory.userService.getUserToken(); //get userToken from local storage.

        //use validator factory to validate the length of the input.
        var inputsAreValid = validatorFactory.checkInputLengthsAreValid(
            [{"input" : reviewText, "minLength" : 10, "maxLength" : 2000}]);

        if(inputsAreValid && (rating > 0 && rating <=5)){
            //inputs are valid and rating is valid so we can proceed
            console.log("stationID " + stationID);
            console.log("userID " + userID); 
            console.log("userToken " + userFactory.userService.getUserToken());
            console.log("inputsAreValid" + inputsAreValid);
            console.log("valid" + reviewText);
            console.log("valid" + $scope.selectedStar);

            //create review and get back all of the reviews data for this station.
            stationFactory.stationService.createReview(stationID, userID, userToken, reviewText, rating).then(function(reviewsData){
                //remove the review form 
                $scope.displayReviewForm = false;
                $scope.resetReviewFormValues();
            });
        }else{
            //inputs are not valid 
        }
    };

    $scope.resetReviewFormValues = function(){
        /*
         * This method resets our review form values.
         * We call this after a review has been submitted.
         */
        $scope.review = {}; //our ng-model for the review form is called review so reset this.
        $scope.selectedStar = 0; //reset the rating
    }; 

    $scope.deleteReview = function(reviewID, stationID){
        /*
         * This method is called when a user chooses to delete a review.
         * The delete review button will only be shown (with ng-show) to the user if the current userID (from userDetails) is equal to the userID
         * of the review creator so no need to check privileges here.
         */
        var confirmation = confirm("Are you sure you want to delete this review?");
        if(confirmation){
            stationFactory.stationService.deleteReview(reviewID, stationID);
        }
    }; 

   $scope.deleteReply = function(replyID, reviewID){
        /*
         * This method is called when a user chooses to delete a reply of a review.
         * The delete reply button will only be shown (with ng-show) to the user if the current userID (from userDetails) is equal to the userID
         * of the reply creator so no need to check privileges here.
         */
        var confirmation = confirm("Are you sure you want to delete this comment?");
        if(confirmation){
            console.log(reviewID);
            stationFactory.stationService.deleteReply(replyID, reviewID);
        }
    }; 
});


