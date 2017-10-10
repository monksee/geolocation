/*
 * This factory takes in the phonegapReady factory which detects when phonegaps deviceready event occurs.
 * 
 */
mapApp.factory('facebookFactory', function($rootScope, $timeout, $q, phonegapReady, validatorFactory){


    var getLoginStatus = function(){
    	var deferred = $q.defer();
    	/* Gets a user's facebook login status.
    	 */
        var deferred = $q.defer();
    	facebookConnectPlugin.getLoginStatus(function(response){
        	//success function
            if(response.status === 'connected'){
            $timeout(function() {
                deferred.resolve(true); //resolve the promise passing in null
            }, 100);
			}else{ 
			
    		$timeout(function() {
                deferred.resolve(false); //resolve the promise passing in null
            }, 100);
    	    }
		}, 
	    function(error){ 
	    	//error function
			//error getting login status
			alert("Facebook get login status Failed: " + error);
			$timeout(function() {
                deferred.resolve(null); //resolve the promise passing in null
            }, 100);
		});//end getLoginStatus	
		return deferred.promise;
    };
    var performFacebookLogin = function(){
    	
    	/* the user is not logged into facebook therefore send them to log in.
    	 */
    	var deferred = $q.defer();
     	facebookConnectPlugin.login(["public_profile"], function(response){
  			//handle the response
			if(response.status === 'connected'){
				//successful login response
				$timeout(function() {
                    deferred.resolve(true); //resolve the promise passing in null
                }, 100);
			}else{ 
    		    $timeout(function() {
                    deferred.resolve(false); //resolve the promise passing in null
                }, 100);
    	    }				   
		},
		function(error){
            $timeout(function() {
                deferred.resolve(null); //resolve the promise passing in null
            }, 100);
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
			   
			    $timeout(function() {
                deferred.resolve(data); //resolve the promise passing in null
            }, 100);
		    },
		    function(error){

    		$timeout(function() {
                deferred.resolve(null); //resolve the promise passing in null
            }, 100);	
		    	
			    //api call failed
        	    alert("Facebook public profile API call failed: " + JSON.stringify(error) + " Please contact <a href='#page-support'>support</a>!" );
    	    }
    	); //end api call
        return deferred.promise;
   
    };


    var processFacebookLogin = phonegapReady(function(){
    	var deferred = $q.defer();
        getLoginStatus().then(function(isConnected) {     
     	    alert('is connected' + isConnected);
            if(!isConnected){

              	performFacebookLogin().then(function(isConnectedNow) {
    	            //Since the checkLoginDetails method (in the loginFactory) is performaing a http request we need to use a promise
    	            //to store the userDetails (from the response) into our $scope.userDetails variable. 
      	            alert('is isConnectedNow' +isConnectedNow);
                    if(isConnectedNow){
                        getProfileDetails().then(function(userData) {
    
    	                    alert('userData' + JSON.stringify(userData));
    	                    //if(userData !== null){
                              //  alert("userData" + userData);
                              $timeout(function() {
                                 deferred.resolve(userData); //resolve the promise passing in null
                              }, 100);
                              //  return userData;
                           //}
    	                });
                    }

                });
            }else{
                getProfileDetails().then(function(userData) {
    
    	            alert('userData' + JSON.stringify(userData));
    	            //if(userData !== null){
                    //  alert("userData" + userData);
                    $timeout(function() {
                        deferred.resolve(userData); //resolve the promise passing in null
                    }, 100);
                              //  return userData;
                           //}
    	        });
            }
        });
         return deferred.promise;
    });

    
     //return public API so that we can access it in all controllers
  	return{
      processFacebookLogin: processFacebookLogin
 	};
});