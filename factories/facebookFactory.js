/*
 * This factory takes in the phonegapReady factory which detects when phonegaps deviceready event occurs.
 * 
 */
mapApp.factory('facebookFactory', function($rootScope, $timeout, $q, phonegapReady, validatorFactory){


    var getLoginStatus = function(){
    	/* 
    	 * Gets a user's facebook login status.
    	 */
        var deferred = $q.defer();
    	facebookConnectPlugin.getLoginStatus(function(response){
        	//success function
            deferred.resolve(response.status); //resolve the promise passing in null
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
    	 * The user is not logged into facebook therefore send them to log in.
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
      
        var deferred = $q.defer();
        facebookConnectPlugin.api(
        	'/me?fields=id, email, name, link, picture', ["public_profile"],
        	function(data){
  			    alert("data" + JSON.stringify(data));
			   
			  //  $timeout(function() {
                    deferred.resolve(data); //resolve the promise passing in null
               // }, 100);
		    },
		    function(error){

    		   // $timeout(function() {
                    deferred.resolve(null); //resolve the promise passing in null
              //  }, 100);	
		    	
			    //api call failed
        	    alert("Facebook public profile API call failed: " + JSON.stringify(error) + " Please contact <a href='#page-support'>support</a>!" );
    	    }); //end api call
        return deferred.promise;
    };

    var processFacebookLogin = phonegapReady(function(){
    	var deferred = $q.defer();
    	var userIsConnected = false;
        getLoginStatus().then(function(responseStatus){   

     	    alert('responseStatus ' + responseStatus);
            if(responseStatus === "connected"){
            	userIsConnected = true;
               
    	    }else if(responseStatus !== null){
              	performFacebookLogin().then(function(responseStatus){
      	            alert('is isConnectedNow' + responseStatus);
                    if(responseStatus === "connected"){
                    	userIsConnected = true;
                    }

                });
            }
            if(userIsConnected){
                getProfileDetails().then(function(userData){
    	            alert('userData' + JSON.stringify(userData));
                    deferred.resolve(userData); 
    	        });
    	    }else{
                deferred.resolve(null); 
    	    }

        });

        return deferred.promise;
    });

    //return public API so that we can access it in all controllers
  	return{
        processFacebookLogin: processFacebookLogin
 	};
});