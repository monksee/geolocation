/*
 * This factory consists of functions which will process a users login details or the userToken stored in local storage
 */
mapApp.factory('loginFactory', function($http, sharedFactory, userFactory){

    var checkLoginDetails = function(data){
        /*
         * This function makes a POSt request to the facebookAuth endpoint to process a user's facebook login details
         * If the facebook details are validated on the server side we get return the profile data for that user
         * We then populate the userService.userDetails object with this data 
         * If an error occurs in the process we return null (instead of the userDetails)
         */
        return $http({
                method: 'POST',
                //url: 'http://localhost/API/facebookAuth?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: 'http://gamuzic.com/API/facebookAuth?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
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
                        }
                }else{
                    //data property is not present in the response or it is present but it is null
                    sharedFactory.buildErrorNotification(response);
                }
                //After the checks to see if the response is valid then store our user data in the userDetails object of the userFactory.
                if(responseUserDataIsValid){               
                    userFactory.userService.setUserDetails(response.data);
                    //store the userToken in local storage.
                    setUserToken(userFactory.userService.userDetails.userToken);
                    return userFactory.userService.userDetails;
            
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    //The controller is expecting the userDetails returned. We pass in null instead.
                    return null;
                }

            },function errorCallback(response){
                sharedFactory.buildErrorNotification(response);
                //The controller is expecting the userDetails returned. We pass in null instead.
                return null;
            });
    };

    var checkUserToken = function(data){
        /*
         * This function makes a POSt request to the tokenAuth endpoint to check if a userToken is valid.
         * We call this function if a userToken is detected in local storage when the app is opened.
         * Since it will be called without a user action taking place, we won't output any errors if they occur
         * If the userToken is validated on server side we get the profile data for the userID stored in that userToken if it exists
         * We then populate the userService userDetails object.
         * If it is not valid, then we just delete it from local storage.
         */
        return $http({
                method: 'POST',
                //url: 'http://localhost/API/tokenAuth?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: 'http://gamuzic.com/API/tokenAuth?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
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
                            console.log("userID is not valid");
                        }
                }
                //After the checks to see if the response is valid then store our user data in the userDetails object of the userFactory.
                if(responseUserDataIsValid){
                    userFactory.userService.setUserDetails(response.data);
                    //store the userToken in local storage.
                    setUserToken(userFactory.userService.userDetails.userToken);
                    return userFactory.userService.userDetails;
                }else{
                    //Since this function is called without any user action taking place we wont output any errors if they occur.
                    //We just clear the token from local storage
                    userFactory.userService.resetUserDetails();
                    localStorage.clear();   
                    return null;
                }
            },function errorCallback(response){
                //Error during checking userToken when the app loaded therefore delete the userToken from local storage and 
                //reset the userDetails object.
                //Do not notify the user of any error.
                localStorage.clear();
                userFactory.userService.resetUserDetails();      
                return null;     
            });   
    };


    var setUserToken = function(userToken){
        //setting the userToken value in localStorage like this will overwrite any value thats currently there (if the "userToken" key exists)
        localStorage.setItem('userToken', userToken);
    };


  	//return public API so that we can access it in all controllers
  	return{
        checkLoginDetails: checkLoginDetails,
        checkUserToken: checkUserToken
 	  };
});