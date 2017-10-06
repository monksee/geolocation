//create a factory so that we can pass these variables between different controllers. 
mapApp.factory('sharedFactory', function(){

    //private variables
    /*
     * Initialize a userDetails object. This object will have the following properties added later:
     * userID, facebookUserID, facebookName, profilePicURL, userPrivilegeID, userToken, isLoggedIn.
     */
    var userService = {
        userDetails : {   
            "userID" : null,
            "facebookUserID" : "",
            "facebookName" : "",
            "facebookProfilePic" : "",
            "userPrivilegeID" : 1,
            "userToken" : "",
            "isLoggedIn" : false
        },
        checkIfUserIsAdmin : function(){
            var userPrivilegeID = this.userDetails.userPrivilegeID;
            if(userPrivilegeID === 2){
                console.log("userPrivilegeID " + userPrivilegeID);
                return true;
            }else{
                console.log("userPrivilegeID " + userPrivilegeID);
                return false;
            }
        }
    }; 

    // console.log("userDetailsisLoggedIn " + userDetails.isLoggedIn);
    // console.log("userDetails " + JSON.stringify(userDetails));
    (function () {
        //this anonymous function should be run when the app is launched/opened to check if a user is logged in.
    if(localStorage.getItem("userToken") === null){
        console.log('if executed');
        //therefore they're not logged in
        userService.userDetails.userToken = "";
        userService.userDetails.isLoggedIn = false;
    }else{
        //get the user token from local storage and check it on the server side before setting isLoggedIn to true.
        userService.userDetails.userToken = localStorage.getItem("userToken");  
        userService.userDetails.isLoggedIn = true;
    }
    })();

    var buildErrorNotification = function(response){
        /*
         * This method takes in a response from an endpoint of our API.
         * It checks if the json data contains a property called "error"
         * The "error" property contains a message that is specific to whatever error occured on the server side so we want to give
         * that clue to the user.
         */
        if(response.hasOwnProperty('data') && response.data !== null && response.data.hasOwnProperty('error')){
            //The response data has the error property
            //I'm not sure about ouputting these errors to the user. They may give away sensitive info.
            //e.g. SQLSTATE[HY000] [1045] Access denied for user 'sarahmon_monksee'@'localhost'
            console.log(response.data.error);
            alert("We\'re sorry but an unexpected error has occured: " + response.data.error);
        }else{
            //Output a more generalized error message.
            alert("We\'re sorry but an unexpected error has occured. Please contact support!");
        }
    };

  	//return public API so that we can access it in all controllers
  	return{
      userService: userService,
      buildErrorNotification: buildErrorNotification
       
 	  };
});