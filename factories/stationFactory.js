/*
 * This factory consists of objects and methods which will process data associated with the petrol stations.
 */
mapApp.factory('stationFactory', function($http, $timeout, $q, sharedFactory){

    var stationService = {
        /* Create an object which holds the stationDetails for the station view
        */
        stationDetails : {
            "stationID" : null,
            "stationName" : "",
            "stationAddressLine1" : "",
            "stationAddressLine2" : "",
            "stationPhoneNumber" : "",
            "stationLatitude" : 0.0,
            "stationLongitude" : 0.0,
            "stationServices" : ""
        }, 
        getStationDetails : function(stationID){ 
            /**
             * This method makes a http GET request to our station Endpoint to retrieve details of a station based on a stationID
             * Each time the user chooses to view a station we call this method to get the data for that chosen station
             * so we can output it to the station.html view.
             * We return the stationDetails or if an error occurs we return null.
             */
            //Firstly define a variable self to reference "this".
            //We do it this way (instead of using bind) as it is more cross-browser compatible.
            var self = this; 

            return $http({
                method: 'GET',
                //url: 'http://localhost/API/station/' + stationID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: 'http://gamuzic.com/API/station/' + stationID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                headers: {
                   'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null
                    if(response.data.hasOwnProperty('stationID') && response.data.stationID !== null){
                        //Check if the stationID property exists and also is not null in the response.
                        //This is the best way to determine whether the stationDetails were successfully generated. 
                        responseDataIsValid = true;
                    }else{
                        sharedFactory.buildErrorNotification(response);
                    }
                }else{
                    //Either the data property is not present in the response, or it is present but it is null
                    sharedFactory.buildErrorNotification(response);
                }

                //After the checks to see if the response is valid then store our station data from the API in the stationDetails object.
                if(responseDataIsValid){
                    self.stationDetails = response.data;
                    //return the stationDetails to the controller
                    return self.stationDetails;
                 
                }else{
                    //There has been an error. The controller is expecting the stationDetails returned from this method. We pass in null instead and check for null in controller.
                    return null;
                 
                }

            },function errorCallback(response){
                console.log('error');
                sharedFactory.buildErrorNotification(response);
                //There has been an error. The controller is expecting the stationDetails returned from this method. We pass in null instead and check for null in controller.
                return null;
            });
       
        }
 	}; //end stationService object

    //return public API so that we can access it in all controllers
    return{
        stationService: stationService
    };
});