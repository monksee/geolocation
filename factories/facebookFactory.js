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
			    alert("Facebook getLoginStatus failed: " + JSON.stringify(error));
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
                alert("Facebook login failed: " + JSON.stringify(error));
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
        facebookConnectPlugin.api('/me?fields=id,name,link,picture',["public_profile"],
        	function(data){
        		//success-handle the response
  			    alert("data" + JSON.stringify(data));
                deferred.resolve(data); 
		    },
		    function(error){
			    //api call failed
        	    alert("Facebook public profile API call failed: " + JSON.stringify(error));
        	    deferred.resolve(null); 
    	}); 

        return deferred.promise;
    };

    var processFacebookLogin = phonegapReady(function(){
    	/* 
    	 * Wrap this function in the phonegapReady function so that it doesn't get called before the phonegap deviceready event occurs.
    	 * (Note: We can only use the facebookConnectPlugin after the deviceready event occurs).
    	 * This function checks a user's facebook login status and returns their public profile data.
    	 * We call this function in our mainController.
    	 */
    	var deferred = $q.defer();
    	var userIsConnected = false;
        getLoginStatus().then(function(responseStatus){   
            //Check the current login status of the user
            alert('get login status responseStatus' + responseStatus);

            if(responseStatus === "connected"){
                alert('get login status responseStatus' + responseStatus);
            	userIsConnected = true;  
            	getProfileDetails().then(function(userData){
                    deferred.resolve(userData); 
    	        });
    	    }else if(responseStatus !== null){
    	    	//If the user is not "connected" then log the user into facebook and our app
              	performFacebookLogin().then(function(responseStatus){
              		alert('perform login responseStatus' + responseStatus);
                    if(responseStatus === "connected"){
                        alert('perform login responseStatus' + responseStatus);
                    	//the user is now logged into facebook and our app
                    	userIsConnected = true;
                    	getProfileDetails().then(function(userData){   
                    	    alert("userData " + userData); 
                    	    var preparedData = validateFacebookDetails(userData);
                            deferred.resolve(preparedData); 
    	                });

                    }else{
                    	//response data is null or other
                    	deferred.resolve(null);                   
                    }
                });
            }else{
            	//response data is null or other
            	deferred.resolve(null);   
                alert('response status not passed');

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