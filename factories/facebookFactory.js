/*
 * This factory takes in the phonegapReady factory which detects when phonegaps deviceready event occurs.
 * 
 */
mapApp.factory('facebookFactory', function($rootScope, $timeout, $q, phonegapReady, validatorFactory){

    var getLoginStatus = function(){
    	/* 
    	 * This function gets a user's facebook login status.
    	 * We will receive response status of "connected" if the user is logged into our app and facebook.
    	 */
        var deferred = $q.defer();
    	facebookConnectPlugin.getLoginStatus(function(response){
        	//success function
            deferred.resolve(response.status); 
		}, 
	    function(error){ 
	    	//error function
			alert("Facebook get login status Failed: " + error);
            deferred.resolve(null); //resolve the promise passing in null      
		});//end getLoginStatus	


		return deferred.promise;
    };


    var performFacebookLogin = function(){
    	/* 
    	 * This function logs a user into facebook.
    	 * On successful login we get a response with a status of "connected" which means 
    	 * the user is now logged into our app and facebook.
    	 */
    	var deferred = $q.defer();
     	facebookConnectPlugin.login(["public_profile"], function(response){
  			//handle the response
			deferred.resolve(response.status); 			   
		},
		function(error){      
            deferred.resolve(null); //resolve the promise passing in null
            alert("FB login Failed: " + JSON.stringify(error));
    	});
		return deferred.promise;
    };


    var getProfileDetails = function(){
        /* 
    	 * This function makes a call to the facebook API and gets a users facebook public profile data 
    	 * The user must be logged in first before we can call this function
    	 */
        var deferred = $q.defer();
        facebookConnectPlugin.api(
        	'/me?fields=id, email, name, link, picture', ["public_profile"],
        	function(data){
  			    alert("data" + JSON.stringify(data));
                deferred.resolve(data); 
		    },
		    function(error){
                deferred.resolve(null); 
			    //api call failed
        	    alert("Facebook public profile API call failed: " + JSON.stringify(error));
    	    }); 
        return deferred.promise;
    };

    var processFacebookLogin = phonegapReady(function(){
    	/* 
    	 * Wrap this function in the phonegapReady function so that it doesn't get called before the phonegap deviceready event occurs.
    	 * We can only use the facebookConnectPlugin after the deviceready event occurs.
    	 * This function checks a users facebook login status and returns their public profile data.
    	 * We call this function in our mainController
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
                            deferred.resolve(userData); 
    	                });
                    }
                });
            }else{
                alert('response status not passed');

            }

           // if(userIsConnected){
            	//If we have received a response status of "connected" now we can get the users profile data.
               // getProfileDetails().then(function(userData){
               //     deferred.resolve(userData); 
    	        //});
    	   // }else{
               // deferred.resolve(null); 
    	   // }

        });

        return deferred.promise;
    });

    //return public API so that we can access it in all controllers
  	return{
        processFacebookLogin: processFacebookLogin
 	};
});