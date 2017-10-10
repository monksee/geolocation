/*
 * This factory takes in the phonegapReady factory which detects when phonegaps deviceready event occurs.
 * 
 */
mapApp.factory('facebookFactory', function($rootScope, $timeout, $q, phonegapReady, validatorFactory){


    var getLoginStatus = phonegapReady(function(){
    	var deferred = $q.defer();
    	/* Gets a user's facebook login status.
    	 */

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
                deferred.resolve(false); //resolve the promise passing in null
            }, 100);
		});//end getLoginStatus	
		return deferred.promise;
    });


    var getProfileDetails = phonegapReady(function(){
        //var isConnected = getLoginStatus();    
       // alert('is connected' + isConnected);

        facebookConnectPlugin.api(
        	'/me?fields=id, email, name, link, picture', ["public_profile"],
        	function(data){
  			    alert("data" + JSON.stringify(data));
			    //Send the data to the server side. 	
			    return data;
		    },
		    function(error){	
		    	return null;
			    //api call failed
        	    alert("Facebook public profile API call failed: " + JSON.stringify(error) + " Please contact <a href='#page-support'>support</a>!" );
    	    }
    	); //end api call

    });


    var processFacebookLogin = phonegapReady(function(){
    	//var deferred = $q.defer();
        getLoginStatus().then(function(isConnected) {
    	        //Since the checkLoginDetails method (in the loginFactory) is performaing a http request we need to use a promise
    	        //to store the userDetails (from the response) into our $scope.userDetails variable. 
      	       
     	      alert('is connected' + isConnected);
        });


        //onSuccess, onError); 

       // alert('is connected' + isConnected);
        if(isConnected){
            var userData = getProfileDetails();
            if(userData !== null){
                alert("userData" + userData);
                return userData;
            }
        }
    });

    
     //return public API so that we can access it in all controllers
  	return{
      processFacebookLogin: processFacebookLogin
 	};
});