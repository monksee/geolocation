//create a factory so that we can pass these variables between different controllers. 
mapApp.factory('sharedFactory', function(){
  	//private variables
    var userDetails = {};
  
    var buildErrorNotification = function(response){
        /*
         * This method takes in a response from an endpoint of our API.
         * It checks if the json data contains a property called "error"
         * The "error" property contains a message that is specific to whatever error occured on the server side so we want to give
         * that clue to the user.
         */
        if(response.hasOwnProperty('data') && response.data !== null && response.data.hasOwnProperty('error')){
            //The response data has the error property
            console.log(response.data.error);
            alert("We\'re sorry but an unexpected error has occured: " + response.data.error);
        }else{
            //Output a more generalized error message.
            alert("We\'re sorry but an unexpected error has occured. Please contact support!");
        }
    };


  	//return public API so that we can access it in all controllers
  	return{
    		userDetails: userDetails,
        buildErrorNotification: buildErrorNotification
 	  };
});