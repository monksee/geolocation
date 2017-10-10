/*
 * This factory consists of objects and methods which will process data associated with a user.
 * i.e Their facebook profile details.
 * Whether or not they are currently logged in.
 * Whether or not they are a regular user or an admin (determined by their userPrivilegeID).
 * We can use this data throughout our controllers by passing the factory in as a parameter to our controllers.
 */
mapApp.factory('userFactory', function(){

    var userService = {
        /*
         * Initialize a userDetails object. This object will have the following properties:
         * userID, facebookUserID, facebookName, facebookProfilePic, userPrivilegeID, userToken, isLoggedIn.
         */
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
            /*
             * This method checks if the user is an admin or not.
             * A userPrivilegeID of 1 is a regular user and 2 is an admin user.
             * Admin privileges will include being able to reply to a user testimonial/review
             * and also being able to delete a testimonial/review
             */
            var userPrivilegeID = this.userDetails.userPrivilegeID;
            if(userPrivilegeID === 2){
                console.log("userPrivilegeID " + userPrivilegeID);
                return true;
            }else{
                console.log("userPrivilegeID " + userPrivilegeID);
                return false;
            }
        },
        setUserDetails : function(responseData){
            /*
             * This method takes in the response data of a http request to our auth endpoints of our API 
             * and stores the new values (within the response data) in the userDetails object.
             */

            this.userDetails = {
                "userID" : responseData.userID,
                "facebookUserID" : responseData.facebookUserID,
                "facebookName" : responseData.facebookName,
                "facebookProfilePic" : responseData.profilePicURL,
                "userPrivilegeID" : responseData.userPrivilegeID,
                "userToken" : responseData.userToken,
                "isLoggedIn" : true
            };
        },
        resetUserDetails : function(){
            /*
             * This method resets the userDetails object to default values.
             */
            this.userDetails = {
                "userID" : null,
                "facebookUserID" : "",
                "facebookName" : "",
                "facebookProfilePic" : "",
                "userPrivilegeID" : 1,
                "userToken" : "",
               "isLoggedIn" : false
            };
        },
        checkIfUserIsLoggedIn : function(){
            /*
             * This method returns the isLoggedIn boolean value of the userDetails object.
             */
            return  this.userDetails.isLoggedIn;
        }
    }; 

  	//return public API so that we can access it in all controllers
  	return{
      userService: userService
 	};
});