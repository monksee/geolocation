/*
 * This factory takes in the phonegapReady factory which detects when phonegaps deviceready event occurs.
 * 
 */
mapApp.factory('facebookFactory', function($rootScope, $timeout, $q, phonegapReady, validatorFactory){

    var getLoginStatus = function(){
    	/* 
    	 * This function uses the facebookConnectPlugin.getLoginStatus function which gets a user's current facebook login status.
    	 * It returns a response.status of "connected" if the user is logged into our app and facebook.
    	 */
        var deferred = $q.defer();
    	facebookConnectPlugin.getLoginStatus(
    		function(response){
        	    //success-handle the response
                deferred.resolve(response.status); 
		    }, 
	        function(error){ 
	    	    //error function
			    handleFacebookError(error);
                deferred.resolve(null);      
		});
		return deferred.promise;
    };


    var performFacebookLogin = function(){
    	/* 
    	 * This function uses the facebookConnectPlugin.login function.
    	 * When we call the facebookConnectPlugin.login function, it firstly detects if a user is logged into facebook.
    	 * If they are logged in, it returns a response.status of "connected".
    	 * If they are not currently logged into facebook, a facebook login dialog will pop up for them to log in.
    	 * If they enter the correct login details in the facebook dialog, it returns a response.status of "connected".
    	 */
    	var deferred = $q.defer();
     	facebookConnectPlugin.login(["public_profile"], 
     		function(response){
  			    //success-handle the response
			    deferred.resolve(response.status); 			   
		    },
		    function(error){   
		        //error function   
		        handleFacebookError(error);
                deferred.resolve(null); 
    	});
		    return deferred.promise;
    };


    var getProfileDetails = function(){
        /* 
    	 * This function makes a call to the facebook API (using the facebookConnectPlugin.api function) and gets a user's facebook public profile data 
    	 * The user must be logged in first before we can call this function
    	 */
        var deferred = $q.defer();
        //Note: On iOS it causes an error if there are spaces between the properties here (issue 338 for cordova-plugin-facebook4 on github)
        //thats why we need to do it as follows: /me?fields=id,email,name,link,picture
        facebookConnectPlugin.api('/me?fields=id,name,lin,picture',["public_profile"],
        	function(data){
        		//success-handle the response
  			    alert("data" + JSON.stringify(data));
  			    var preparedData = validateFacebookDetails(data);
                deferred.resolve(preparedData); 
            
		    },
		    function(error){
			    //api call failed
        	    alert("Facebook public profile API call failed: " + JSON.stringify(error));
        	    deferred.resolve(null); 
    	}); 

        return deferred.promise;
    };



    var handleFacebookError = function(error){
    	/* 
    	 * The facebook API returns errors as objects on android and returns an error as a string on iOS.
    	 * So this function firstly checks what "type" the error is (object or string) and then handles it
    	 * Also looking out for the "User cancelled dialog" error as we do not want to output a message to user when this error occurs.
    	 */
        if(error !== null && typeof error === 'object'){
        	//Error is an object so therefore we are on android 
        	//The errorCode returned for "User cancelled dialog" is 4201.
            //Whenever we get this error we should not output an error to the user.

            if(!(error.hasOwnProperty('errorCode') && error.errorCode === "4201")){
                //This is not a "User cancelled dialog" (4201) error so we can output the error to the user   
                alert("We're sorry but there was a problem processing your request " + error.errorMessage); 
            }

        }else{
        	//Error is not an object therefore we are on iOS and the error is a string.
        	//Check if the error string equals "User cancelled" because this is what iOS returns when user cancels out of logging in to facebook. 
        	if(error.indexOf("User cancelled") == -1){
        		//The error string does not contain User cancelled so we can output the error.
                alert("We're sorry but there was a problem processing your request " + error);

        	}

         }
    };

    var processFacebookLogin = phonegapReady(function(){
    	/* 
    	 * Wrap this function in the phonegapReady function so that it doesn't get called before the phonegap deviceready event occurs.
    	 * (Note: We can only use the facebookConnectPlugin after the deviceready event occurs).
    	 * This function checks a user's facebook login status and returns their public profile data.
    	 * If an error occurs along the way, we return null so that we can check for this in our mainCntroller (when this function is called).
    	 */
    	var deferred = $q.defer();

        getLoginStatus().then(function(responseStatus){   
            //Check the current login status of the user
            alert('get login status responseStatus' + responseStatus);

            if(responseStatus === "connected"){
                alert('get login status responseStatus' + responseStatus);
            	
            	getProfileDetails().then(function(preparedData){ 
            		//preparedData will be null if there was an error when getProfileDetails() was called
            		//or if the user data was invalid after calling validateFacebookDetails
            		alert("preparedData " + preparedData); 

                    deferred.resolve(preparedData); 
    	        });
    	    }else if(responseStatus !== null){
    	    	//If the user is not "connected" then log the user into facebook and our app
              	performFacebookLogin().then(function(responseStatus){
              		alert('perform login responseStatus' + responseStatus);
                    if(responseStatus === "connected"){
                        alert('perform login responseStatus' + responseStatus);
                    	//the user is now logged into facebook and our app
                        getProfileDetails().then(function(preparedData){
            		        //preparedData will be null if there was an error when getProfileDetails() was called
            		        //or if the user data was invalid after calling validateFacebookDetails
            		        alert("preparedData " + preparedData); 
                        
                            deferred.resolve(preparedData); 
    	                });
                    
                    }else{
                    	//response data is null so return null.
                    	//We will check for null when this method is called and stop the process there.
                    	deferred.resolve(null);                   
                    }
                });
            }else{
            	//response data is null so return null.
            	//We will check for null when this method is called and stop the process there.
            	deferred.resolve(null);   
            }
        });

        return deferred.promise;
    });


    var validateFacebookDetails = function(userDetails){
        //check if userDetails is null
     
        var facebookUserID = userDetails.id;
        var facebookName = userDetails.name;
        var profilePicURL = "https://graph.facebook.com/" + userDetails.id + "/picture?type=large&w‌​idth=200&height=200";  


	    var inputsAreValid = validatorFactory.validateFacebookInputs(
	    	[{"input" : facebookUserID, "minLength" : 1, "maxLength" : 30, "regex" : /^\d+$/},
            {"input" : facebookName, "minLength" : 1, "maxLength" : 60},
            {"input" : profilePicURL, "minLength" : 1, "maxLength" : 250}]);
  
        console.log("inputsAreValid " + inputsAreValid);
        alert(inputsAreValid);
        if(inputsAreValid){
              	//After inputs are checked for validity then we call the checkLoginDetails method to perform the http request to the server side
            var data = {
                "facebookUserID" : facebookUserID, 
                "facebookName" : facebookName, 
                //"profilePicURL" : "https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/21617751_10213716829451248_7798041643913998634_n.jpg?oh=7242e13b731a211fa7ac77ed443ec96f&oe=5A483F35"
                "profilePicURL" : profilePicURL
            };
            return data;
        }else{
            return null;

        }
    };


    //return public API so that we can access it in all controllers
  	return{
        processFacebookLogin: processFacebookLogin
 	};
});