/*
 * A factory that makes calls to PhoneGap's geolocation API.
 */
mapApp.factory('localStorageFactory', function (phonegapReady) {
    return {
        //we want to wrap our implementation in our phonegapReady function in case deviceready has not fired yet.
        //If deviceready has not fired then this call will be put in a queue until it fires.
        checkLocalStorage: phonegapReady(function () {
           if(localStorage.getItem("userToken") === null){
        //If there is no userToken in local storage, then we will not want the userDetails object to have any user Details.
        //So reset the userDetails object.
        //This covers such a case where the user has deleted their local storage manually but the userDetails object still exists with their data.
            alert('reset details');
            userFactory.userService.resetUserDetails();

        }else{
          //userToken key exists in local storage so check this token on the server side to make sure its valid.
            var data = {
              "userToken" : localStorage.getItem("userToken")
               // "userToken" : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjMxLCJmYWNlYm9va1VzZXJJRCI6IjEwMjEzNzE4NTUyNjE0MzI2In0.SdWuJQ8uvAt4neH6Pxr0zzh_TRB5un2rKWYQHfo2fpo"
            };
            loginFactory.checkUserToken(data).then(function(userDetails) {
              //Since the checkUserToken method (in the loginFactory) is performaing a http request we need to use a promise
              //to store the userDetails (from the response) into our $scope.userDetails variable. 
                $scope.userDetails = userDetails;
              console.log("$scope.userDetails" + JSON.stringify($scope.userDetails));
            });
        }
        })
    };
});