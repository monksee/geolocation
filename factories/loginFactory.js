//create a factory so that we can pass these variables between different controllers. 
mapApp.factory('loginFactory', function($http, $timeout, $q, sharedFactory){
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
    var checkLoginDetails = function(data){
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: 'http://localhost/API/auth?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
            data : JSON.stringify(data),
            headers: {
               'Content-Type': 'application/json;charset=utf-8'
            },
            responseType:'json'
        }).then(function successCallback(response){
            console.log('success');
            console.log(response);

            //Do checks to see if the response data is valid. If not valid then build the error notification
            var responseDataIsValid = false; //initialize boolean to false
            if(response.hasOwnProperty('data') && response.data !== null){
                //check if the data property is present in the response and it is not null
                    if(response.data.hasOwnProperty('userDetails') && response.data.userDetails !== null){
                        responseDataIsValid = true;
                    }else{
                        //data is not null but the userDetails property is not valid
                        sharedFactory.buildErrorNotification(response);
                    }
            }else{
                //data property is not present in the response or it is present but it is null
                sharedFactory.buildErrorNotification(response);
            }
            //After the checks to see if the response is valid then prepare our data.
            if(responseDataIsValid){
              alert(JSON.stringify(response.data));
                sharedFactory.userDetails = response.data.userDetails;
                $timeout(function() {
                    deferred.resolve(sharedFactory.userDetails);
                }, 100);
            }
        },function errorCallback(response){
            console.log('error');
            sharedFactory.buildErrorNotification(response);
       
        });
        return deferred.promise;
    };

    var getLoginInfo = function(){
      return loginInfo;
    };

  	//return public API so that we can access it in all controllers
  	return{
    		getLoginInfo: getLoginInfo,
        checkLoginDetails: checkLoginDetails,
        userDetails: userDetails
 	  };
});