//create a factory so that we can pass these variables between different controllers. 
mapApp.factory('loginFactory', function($http, $timeout, $q) {
  	//private variables
  	var _sessionId;
  	var _isLoggedIn;
  	if(localStorage.getItem("sessionId") === null){
  		//therefore they're not logged in
  		_sessionId = "";
  		_isLoggedIn = false;
  	}else{
  		_sessionId = localStorage.getItem("sessionId");	
  		_isLoggedIn = true;
  	}

    var userDetails = {};
  	var loginInfo = { userDetails: {username: "", sessionId: _sessionId }, isLoggedIn : _isLoggedIn};


    //Methods which perform API calls 
    var checkLoginDetails = function(data) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'http://localhost/API/auth',
            data : JSON.stringify(data),
            headers: {
               'Content-Type': 'application/json;charset=utf-8'
            },
            responseType:'json'
        }).then(function successCallback(response) {
            console.log('success');
            console.log(response);
            if(response.hasOwnProperty('data')){
                //check if the data property is present in the response
                if(response.data == null){
                    //display error message to user as the data property is null
                    alert("We\'re sorry but an unexpected error has occured: Data is null. Please contact support!");
                }else{
                    //data property is present and is not null
                    if(response.data.hasOwnProperty('error')){
                        //the error property will exist here in the JSON returned if the HTTP method in the request does not
                        //correspond to that in the endpoint.
                        console.log(response.data.error);
                        alert("We\'re sorry but an unexpected error has occured: " + response.data.error);
                    }else{
                        //data property of the response contains a value and there is no error property.
                        checkUserDetailsAreValid(response.data, userDetails, deferred);
                    }
                } 
            }else{
                //data property is not present in the response
                alert("We\'re sorry but an unexpected error has occured: No data. Please contact support! ");
            }
        },function errorCallback(response) {
            if(response.data.hasOwnProperty('error')){
                //the error property will exist here (in the JSON returned) if there is no endpoint 
                //alert the error message
                alert("We\'re sorry but an unexpected error has occured: " + response.data.error);
            }else{

                alert("We\'re sorry but an unexpected error has occured. Please contact support!");
            }
       
        });
        return deferred.promise;
    };



    var checkUserDetailsAreValid = function(data, userData, deferred) {
          if(data.hasOwnProperty('userDetails') && data.userDetails !== null){
              //Store the userDetails in the response in our userDetails global variable
              userData = data.userDetails;
              $timeout(function() {
                  deferred.resolve(userData);
                            }, 100);
              }else{
              alert("We\'re sorry but an unexpected error has occured during authentication. Please contact support!");
          }
    };


    var getLoginInfo = function(){
      return loginInfo;
    };



  	//return public API so that we can access it in all controllers
  	return {
    		getLoginInfo: getLoginInfo,
        checkLoginDetails: checkLoginDetails,
        userDetails: userDetails
 	};
});