/*
 * This factory takes in the phonegapReady factory which detects when phonegaps deviceready event occurs.
 * 
 */
mapApp.factory('facebookFactory', function($rootScope, phonegapReady, validatorFactory){


    var getLoginStatus = phonegapReady(function(onSuccess, onError){
    	/* Gets a user's facebook login status.
    	 */
    	facebookConnectPlugin.getLoginStatus(onSuccess, onError);
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
        var isConnected = getLoginStatus(
        function(response){

        	//success function
            if(response.status === 'connected'){
            	alert('true');
                   return true;
			}else{ 
				alert('false');
			       return false;
    		}//end of else statement			
		}, 
	    function(error){ 
	    	//error function
			//error getting login status
			alert("Facebook get login status Failed: " + error);
			return false;
		});


        //onSuccess, onError); 

        alert('is connected' + isConnected);
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