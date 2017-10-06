
mapApp.factory('loginFactory', function($http, $timeout, $q, sharedFactory){

    //Methods which perform API calls 
    var checkLoginDetails = function(data){
        var deferred = $q.defer();
        $http({
            method: 'POST',
            //url: 'http://localhost/API/facebookAuth?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
           url: 'http://gamuzic.com/API/facebookauth?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
            data: JSON.stringify(data),
            headers: {
               'Content-Type': 'application/json;charset=utf-8'
            },
            responseType:'json'
        }).then(function successCallback(response){
            //Do checks to see if the response data is valid. If not valid then build the error notification
            var responseUserDataIsValid = false; //initialize boolean to false
            if(response.hasOwnProperty('data') && response.data !== null){
                //check if the data property is present in the response and it is not null
                    if(response.data.hasOwnProperty('userID') && response.data.userID !== null){
                        //Check if the userID property exists and also is not null in the response.
                        //This is the best way to determine whether the user details were successfully generated. 
                        responseUserDataIsValid = true;
                    }else{
                        //data is not null but the facebookUserDetails property is not valid
                        sharedFactory.buildErrorNotification(response);
                    }
            }else{
                //data property is not present in the response or it is present but it is null
                sharedFactory.buildErrorNotification(response);
            }
            //After the checks to see if the response is valid then store our user data in the userDetails object of the sharedFactory.
            if(responseUserDataIsValid){
                console.log(JSON.stringify(response.data));
                sharedFactory.userService.userDetails = setUserDetails(response);
     
                console.log(JSON.stringify(sharedFactory.userService.userDetails));
  
              //  if(localStorage.getItem("userToken") === null){
               //     localStorage.setItem('userToken', sharedFactory.userService.userDetails.userToken);
               // }
                
                $timeout(function() {
                    deferred.resolve(sharedFactory.userService.userDetails);
                }, 100);
            }
        },function errorCallback(response){
            console.log('error');
            sharedFactory.buildErrorNotification(response);
       
        });
        //return the userDetails promise
        return deferred.promise;
    };

    var setUserDetails = function(response){
        /*
         * This method takes in the response of a http request to the auth endpoint and creates a userDetails object with the response data.
         * We will use this method to store our userDetails data in our sharedFactory.userService.userDetails object.
         */
        var userDetails = {
            "userID" : response.data.userID,
            "facebookUserID" : response.data.facebookUserID,
            "facebookName" : response.data.facebookName,
            "facebookProfilePic" : response.data.profilePicURL,
            "userPrivilegeID" : response.data.userPrivilegeID,
            "userToken" : response.data.userToken,
            "isLoggedIn" : true
        };
        return userDetails;
    };
    
  	//return public API so that we can access it in all controllers
  	return{
        checkLoginDetails: checkLoginDetails
 	  };
});