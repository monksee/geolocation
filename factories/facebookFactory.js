/*
 * This factory takes in the phonegapReady factory which detects when phonegaps deviceready event occurs.
 * 
 */
mapApp.factory('facebookFactory', function($rootScope, phonegapReady, validatorFactory){
    return {
        processFacebookLogin: phonegapReady(function(response){
            alert('facebook');
            facebookConnectPlugin.getLoginStatus(function(response){
                if (response.status === 'connected') {
                    //the user is logged into our app and facebook.
				    //now we need to get their facebook ID and check if they are already registered with us. 
				    //ie their facebook id exists in the facebookUserID field of the database
				    //alert(JSON.stringify(response));	
				    facebookConnectPlugin.api('/me?fields=id, email, name, link, picture', ["public_profile"],function(data){
  					    alert("data" + JSON.stringify(data));
					    //Send the data to the server side. 	
				        return data;
				    }
				    ,function(error){	
					    //api call failed
        				alert("Facebook public profile API call failed: " + JSON.stringify(error) + " Please contact <a href='#page-support'>support</a>!" );
    				}); //end api call
			    }else{ 
			        //response.status is not connected.
				    //the user is not logged into facebook therefore send them to log in.
      				facebookConnectPlugin.login(["public_profile"], function(response){
  					    //handle the response
					    if(response.status === 'connected'){
						    //successful login response
					
						    facebookConnectPlugin.api('/me?fields=id, email, name, link, picture', ["public_profile"],function(data){
  							    alert("data" + JSON.stringify(data));  
  							    return data;
						    }
						    ,function(error_profile){	
							    //api call failed
        						alert("Facebook public profile API call failed: " + JSON.stringify(error_profile) + " Please contact <a href='#page-support'>support</a>!" );
    						}); //end api call
					    }//end of response.status === 'connected' if statement
				    }
				    ,function(error){
        			    alert("FB login Failed: " + JSON.stringify(error));
    				});
    			}//end of else statement			
		    }, 
		    function(error){ 
			    //error getting login status
			    alert("Facebook get login status Failed: " + error);
		    });//end getLoginStatus	
        })
    };
});