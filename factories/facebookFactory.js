
mapApp.factory('facebookFactory', function ($rootScope, phonegapReady) {
  return {
    processFacebookLogin: phonegapReady(function (response) {




		alert('facebook');
		facebookConnectPlugin.getLoginStatus(function(response) {
			if (response.status === 'connected') {
      				//the user is logged into our app and facebook.
				//now we need to get their facebook email address and check if they are registered with us. 
				//ie their email address exists in the database
				//alert(JSON.stringify(response));	
				facebookConnectPlugin.api('/me?fields=id, email, name, link, picture', ["public_profile"],function(data) {
  					alert("data" + JSON.stringify(data));
						
				}
				//when i take away this error function the success function executes but if i leave this here the success 
				//function doesnt execute
				,function(error_profile){	
					//api call failed
        				alert("Facebook public profile API call failed: " + JSON.stringify(error_profile) + " Please contact <a href='#page-support'>support</a>!" );
    				}); //end api
			}else{ //response.status is not connected.

				//the user is not logged into facebook therefore send them to log in.
      				facebookConnectPlugin.login(["public_profile"], function(response) {
  					//handle the response
					
					if(response.status === 'connected'){
						//successful login response

						alert(JSON.stringify(response));
						facebookConnectPlugin.api('/me?fields=id, email, name, link, picture', ["public_profile"],function(data) {
  							alert("data" + JSON.stringify(data));
						
						}
						//when i take away this error function the success function executes but if i leave this here the success 
						//function doesnt execute
						,function(error_profile){	
							//api call failed
        						alert("Facebook public profile API call failed: " + JSON.stringify(error_profile) + " Please contact <a href='#page-support'>support</a>!" );
    						}); //end api		

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