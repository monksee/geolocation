/*
 * This factory consists of objects and methods which will process data associated with the petrol stations.
 */
mapApp.factory('stationFactory', function($http, $timeout, $q, $compile, sharedFactory, userFactory, reviewFactory, geolocationFactory){
    "use strict";
    var stationService = {};

    /* Create an object which holds the stationDetails for the station view
    */
    stationService.stationDetails = {
            "stationID" : null,
            "stationName" : "",
            "stationAddressLine1" : "",
            "stationAddressLine2" : "",
            "stationAddressLine3" : "",
            "stationPhoneNumber" : "",
            "stationLatLng" : {"lat" : 0.0, "lng" : 0.0},
            "stationServices" : [],
            "averageRatingData" : {},
            "reviews" : []
    };
    /* Create an array which will hold all info needed to pinpoint all of our stations on a google map.
     * Each element of this array will be an object for example the following:
     * {"stationID" : 5, "stationName" : "", "stationLatLng" : {"lat" : 0.0, "lng" : 0.0}}
     */
    stationService.allStationsMapData = [];

    stationService.map;
    stationService.currentPosition = {};
    stationService.destinationLatLng = {};
    stationService.directionsDisplay;
    stationService.directionsService;

    stationService.getAllStationsMapData = function(){
         /**
         * This method makes a http GET request to our allStationsMapData Endpoint to retrieve details needed for all 
         * stations to be pinpointed on a google map.
         * The home view will display the google map however we will call this method in the mainController.
         * This API call should only be made once the app opens (not everytime we go to the home view)
         * We return the allStationsMapData array or if an error occurs we return null.
         */
        var self = this; 
        return $http({
            method: 'GET',
           // url: 'http://localhost/API/allStationsMapData?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
            url: 'http://gamuzic.com/API/allStationsMapData?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
            headers: {
               'Content-Type': 'application/json;charset=utf-8'
            },
            responseType:'json'
        }).then(function successCallback(response){
            //Do checks to see if the response data is valid. 
            var responseDataIsValid = false; //initialize boolean to false
            if(response.hasOwnProperty('data') && response.data !== null){
                //check if the data property is present in the response and it is not null
                if(!response.data.hasOwnProperty('error')){     
                    //response does not have error property therefore it is valid       
                    responseDataIsValid = true;
                }
            }
            if(responseDataIsValid){           
                self.allStationsMapData = self.prepareStationMapData(response.data);
               console.log(JSON.stringify(self.allStationsMapData));
                return self.allStationsMapData;
            }else{
                return null;
            }
        },function errorCallback(response){
            sharedFactory.buildErrorNotification(response);
            return null;
        });
    };


    stationService.prepareStationMapData = function(allStationsMapData){
        /*
         * This method takes in the stations map data that we retrieved on the server side from our database and prepares
         * it in the way that we need it for our google map.
         * i.e it converts the lat and lng points to float numbers as they were incorrectly interpreted as strings without this.
         * We also create a stationShortAddress with the name and addressLine2 of the station so that we can display this
         * in the select menu of the directions form for the destination.
         */
        var preparedMapData = [];
        allStationsMapData.forEach(function(stationMapData) {
            preparedMapData.push({
                "stationName" : stationMapData.stationName,
                "stationShortAddress" : stationMapData.stationName + " " + stationMapData.stationAddressLine2,
                "stationLatLng" : {"lat" : parseFloat(stationMapData.stationLatLng.lat), "lng" : parseFloat(stationMapData.stationLatLng.lng)},
                "stationID" : stationMapData.stationID
            });
        }); 
        return preparedMapData;
    };

    stationService.getStationLatLngPoints = function(destinationStationID, allStationsMapData){
        /*
         * This method takes in the stationID of a destination and searches the allStationsMapData array for that stationID.
         * If found, it returns the lat and lng points of that station.
         * We will use this after the directions form is submitted as the destinationStationID will be passed in from the select menu.
         *
         */
        var stationLatLng = {};
        allStationsMapData.forEach(function(stationMapData) {
           if(stationMapData.stationID == destinationStationID){
               //destinationStationID has been found in the array so get lat and lng points
               stationLatLng = stationMapData.stationLatLng;
           }

        }); 
        return stationLatLng;
    };

    stationService.getStationDetails = function(stationID){ 
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
           // url: 'http://localhost/API/station/' + stationID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
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
                //calculate the average rating for this station (by looking at the rating in each review).
                var averageRatingData = reviewFactory.reviewService.getAverageRating(response.data.reviews);

                //add the average rating as a property to the stationDetails object.
                self.stationDetails.averageRatingData = averageRatingData;
                //We need to alter the reviews array that comes back in the response so we can add a ratingInStars property to each review
                //We do this using the prepareReviews method of the reviewsFactory
                self.stationDetails.reviews = reviewFactory.reviewService.prepareReviews(response.data.reviews);
  
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
 	}; 

    stationService.createReview = function(stationID, userToken, reviewText, rating){
        /**
         * This method makes a http POST request to our createReview Endpoint to create a new review (for a particular station) with data entered by the user
         * We return the new review data and also store it into our stationDetails object.
         * If an error occurs we return null
         */
        var self = this; 
        var data = {
            "stationID" : stationID, 
            "userToken" : userToken,
            "reviewText" : reviewText,
            "reviewRating" : rating
        };
        return $http({
                method: 'POST',
               //url: 'http://localhost/API/createReview?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: 'http://gamuzic.com/API/createReview?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                 //console.log(JSON.stringify(response));
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null    
                    if(!response.data.hasOwnProperty('error')){     
                        //response does not have error property therefore it is valid       
                        responseDataIsValid = true;
                    }
                }
                //After the checks to see if the response is valid then store our review data into our stationDetails object
                if(responseDataIsValid){        
                    console.log("reviews " + JSON.stringify(response.data));
                    var averageRatingData = reviewFactory.reviewService.getAverageRating(response.data);
                    var reviews = reviewFactory.reviewService.prepareReviews(response.data); 
                    self.stationDetails.averageRatingData = averageRatingData;
                    self.stationDetails.reviews = reviews;
                    //create an object with the new reviews data to return from this method
                    var reviewsData = {"averageRatingData" : self.stationDetails.averageRatingData, "reviews" : self.stationDetails.reviews};
                    return reviewsData;
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    return null;
                }
            },function errorCallback(response){
                sharedFactory.buildErrorNotification(response);
                return null;
            });
    }; 

    stationService.editReview = function(reviewID, stationID, userToken, editedReviewText, newRating){
        /**
         */
        var self = this; 
        var data = {
            "stationID" : stationID, 
            "userToken" : userToken,
            "editedReviewText" : editedReviewText,
            "newRating" : newRating
        };
        return $http({
                method: 'PUT',
                //url: 'http://localhost/API/editReview/' + reviewID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: 'http://gamuzic.com/API/editReview/' + reviewID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                 //console.log(JSON.stringify(response));
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null    
                    if(!response.data.hasOwnProperty('error')){     
                        //response does not have error property therefore it is valid       
                        responseDataIsValid = true;
                    }
                }
                //After the checks to see if the response is valid then store our review data into our stationDetails object
                if(responseDataIsValid){        
                    console.log("reviews " + JSON.stringify(response.data));
                    var averageRatingData = reviewFactory.reviewService.getAverageRating(response.data);
                    var reviews = reviewFactory.reviewService.prepareReviews(response.data); 
                    self.stationDetails.averageRatingData = averageRatingData;
                    self.stationDetails.reviews = reviews;
                    //create an object with the new reviews data to return from this method
                    var reviewsData = {"averageRatingData" : self.stationDetails.averageRatingData, "reviews" : self.stationDetails.reviews};
                    return reviewsData;
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    return null;
                }
            },function errorCallback(response){
                sharedFactory.buildErrorNotification(response);
                return null;
            });
    }; 


    stationService.deleteReview = function(reviewID, stationID){
         /**
         * This method makes an API call to our deleteReview endpoint and deletes the review with a unique ID of reviewID
         * We pass in the ID of the station that the review belongs to so that we can get the new reviews array after the review is deleted
         * We need to send the userToken with this request. 
         */
        var self = this; 
        var data = {
            "userToken" : userFactory.userService.getUserToken(),
            "stationID" : stationID
        };
        return $http({
                method: 'DELETE',
             // url: 'http://localhost/API/deleteReview/' + reviewID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
               url: 'http://gamuzic.com/API/deleteReview/' + reviewID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                console.log(JSON.stringify(response));
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null    
                    if(!response.data.hasOwnProperty('error')){     
                        //response does not have error property therefore it is valid  

                        responseDataIsValid = true;
                    }
                }
                //After the checks to see if the response is valid then store our review data into our stationDetails object
                if(responseDataIsValid){        
                    console.log("reviews " + JSON.stringify(response.data));
                    var averageRatingData = reviewFactory.reviewService.getAverageRating(response.data);
                    var reviews = reviewFactory.reviewService.prepareReviews(response.data); 
                    self.stationDetails.averageRatingData = averageRatingData;
                    self.stationDetails.reviews = reviews;
                    //create an object with the new reviews data to return from this method
                    var reviewsData = {"averageRatingData" : self.stationDetails.averageRatingData, "reviews" : self.stationDetails.reviews};
                    return reviewsData;
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    return null;
                }
            },function errorCallback(response){
                console.log(JSON.stringify(response));
                sharedFactory.buildErrorNotification(response);
                return null;
            });
    }; 


    stationService.createReply = function(reviewID, userToken, replyText){
        /**
         */
        var self = this; 
        var data = {
            "reviewID" : reviewID, 
            "userToken" : userToken,
            "replyText" : replyText
        };
        return $http({
                method: 'POST',
               // url: 'http://localhost/API/createReply?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: 'http://gamuzic.com/API/createReply?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                 //console.log(JSON.stringify(response));
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null    
                    if(!response.data.hasOwnProperty('error')){     
                        //response does not have error property therefore it is valid       
                        responseDataIsValid = true;
                    }
                }
                if(responseDataIsValid){        
                    console.log("replies " + JSON.stringify(response.data));
                    console.log("self.stationDetails.reviews " + JSON.stringify(self.stationDetails.reviews));
                    var replies = response.data;
                    var currentReviewsArray = self.stationDetails.reviews;
                    //store the replies array that came back in the response in stationDetails reviews array for the review with ID of reviewID
                    //the scope will be automatically updated with the new reviews array now so need to return the array here
                    reviewFactory.reviewService.setReviewReplies(reviewID, currentReviewsArray, replies);
                    console.log("self.stationDetails.reviews2 " + JSON.stringify(self.stationDetails.reviews));
           
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    return null;
                }
            },function errorCallback(response){
                sharedFactory.buildErrorNotification(response);
                return null;
            });
    }; 

    stationService.editReply = function(replyID, reviewID, userToken, editedReplyText){
        /**
         */
        var self = this; 
        var data = {
            "reviewID" : reviewID, 
            "userToken" : userToken,
            "editedReplyText" : editedReplyText
        };
        return $http({
                method: 'PUT',
                //url: 'http://localhost/API/editReply/' + replyID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: 'http://gamuzic.com/API/editReply/' + replyID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                 //console.log(JSON.stringify(response));
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null    
                    if(!response.data.hasOwnProperty('error')){     
                        //response does not have error property therefore it is valid       
                        responseDataIsValid = true;
                    }
                }
                //After the checks to see if the response is valid then store our review data into our stationDetails object
                if(responseDataIsValid){        
                    console.log("replies " + JSON.stringify(response.data));
                    //the response data will be an array of replies (with the edited reply) for a particular review (with ID of reviewID).

                    var repliesArray = response.data;
                    var currentReviewsArray = self.stationDetails.reviews;
                    //call the setReviewReplies method (from the reviewFactory) in order to store the new replies array that comes back in the response
                    //into the review that it belongs to.
                    reviewFactory.reviewService.setReviewReplies(reviewID, currentReviewsArray, repliesArray);

                    //We return the new reviews array however currently we don't need to do this as the scope will update when the stationDetails object updates anyway
                    return self.stationDetails.reviews;
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    return null;
                }
            },function errorCallback(response){
                sharedFactory.buildErrorNotification(response);
                return null;
            });
    };

    stationService.deleteReply = function(replyID, reviewID){
        /**
         * This method makes an API call to our deleteReply endpoint and deletes a reply comment (from a review) with a unique ID of replyID
         * We pass in the ID of the review that the reply comment belongs to so that we can regenerate the replies array after the comment is deleted
         * We need to send the userToken with this request. 
         */
        var self = this; 
        var data = {
            "userToken" : userFactory.userService.getUserToken(),
            "reviewID" : reviewID
        };
        return $http({
                method: 'DELETE',
               // url: 'http://localhost/API/deleteReply/' + replyID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: 'http://gamuzic.com/API/deleteReply/' + replyID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                console.log(JSON.stringify(response));
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null    
                    if(!response.data.hasOwnProperty('error')){     
                        //response does not have error property therefore it is valid       
                        responseDataIsValid = true;
                    }
                }
                //After the checks to see if the response is valid then store our reply data for this review into our stationDetails object
                if(responseDataIsValid){        
                    console.log("replies " + JSON.stringify(response.data));
                    //the response data will be an array of replies (minus the reply that was deleted) for a particular review (with ID of reviewID).

                    var repliesArray = response.data;
                    var currentReviewsArray = self.stationDetails.reviews;
                    //call the setReviewReplies method (from the reviewFactory) in order to store the new replies array that comes back in the response
                    //into the review that it belongs to.
                    reviewFactory.reviewService.setReviewReplies(reviewID, currentReviewsArray, repliesArray);
  
                    //We return the new reviews array however currently we don't need to do this as the scope will update when the stationDetails object updates anyway
                    return self.stationDetails.reviews;
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    return null;
                }
            },function errorCallback(response){
                sharedFactory.buildErrorNotification(response);
                return null;
            });
    }; 

    stationService.prepareStationsOnMap = function(allStationsMapData, scope, location){ 
        /*
         * This method takes in data for all our station data and pinpoints the station locations on a google map with id of map.
         * We use this in our main controller after we have detected that the home view has finished loading.
         */
        var self = this;
        var infoWindow = new google.maps.InfoWindow();
        self.map = new google.maps.Map(document.getElementById('map'),{
            zoom: 9,
            center: allStationsMapData[0].stationLatLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false
        });

        for(var i = 0; i < allStationsMapData.length; i++){

            (function(stationMapData){
                var infoWindowHTMLContent = self.generateInfoWindowContent(stationMapData.stationID, stationMapData.stationName, stationMapData.stationLatLng);
                var compiled = $compile(infoWindowHTMLContent)(scope);
                var marker = new google.maps.Marker({
                    map: self.map,
                    position: stationMapData.stationLatLng,
                    stationID: stationMapData.stationID,
                    icon: 'http://gamuzic.com/map_app3/images/icon.png',
                   // icon: 'http://localhost/phonegap_tut/images/icon.png',
                    content: compiled[0],
                });
             
                google.maps.event.addDomListener(marker, 'click', function(){
                    infoWindow.setContent(this.content);
                    infoWindow.open(self.map, this);
                });
            })(allStationsMapData[i]);

        }
    };

    stationService.generateInfoWindowContent = function(stationID, stationName, stationLatLng){ 
        /*
         * This method prepares HTML for the content of the google map info winodw (i.e the popups that come up when you click 
         * on a marker).
         * This method is called in prepareStationsOnMap.
         */
        var infoWindowHTML = '<div><h4>' + stationName + '</h4>' + 
                             '<a class="info_window_button" href="#station?stationID=' + stationID + '">View more info</a>' + 
                             '<input class="info_window_button" type="button" value="Get directions"' + 
                             ' data-ng-click="getDirections(' + stationID + ')"/></div>';

        return infoWindowHTML;
    };

    stationService.prepareCurrentLocation1 = function(){ 
        /*
         * This method gets a user's current position, marks it on the map and also stores the lat and lng into
         * our object called currentPosition.
         * We also enter this current position to the From input field in our directions form
         */
        var self = this;
        var deferred = $q.defer();
        if(navigator.geolocation){

            var timeoutVal = 10 * 1000 * 1000;  
            navigator.geolocation.getCurrentPosition(
                function(position){
                    self.currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    console.log(JSON.stringify(self.currentPosition));
                    var marker = new google.maps.Marker({
                        position: self.currentPosition, 
                        map: self.map, 
                        title:"User location",
                        icon: 'http://gamuzic.com/map_app3/images/you_icon.png',
                       // icon: 'http://localhost/phonegap_tut/images/you_icon.png',
                        optimized: false,
                        zIndex:99999999
                    }); 
                    //return the current position. This will be an object with lat and lng points.
                    deferred.resolve(self.currentPosition); 
                },
                function(error) {
                    var errors = { 
                        1: 'Permission denied',
                        2: 'Position unavailable',
                        3: 'Request timeout'
                    };
                    if(errors[error.code] == 'Permission denied'){
                        alert("Error: Current location inaccessible. Please ensure location services are enabled in the settings on your device."); 
                    }else{
   
                        alert("Error: " + errors[error.code] + ". Please enter your starting position in the form to get directions");
                    }  
                    deferred.resolve(null);    
                },
              { enableHighAccuracy: true, timeout: timeoutVal, maximumAge: 0 }
            );

        }else{
            deferred.resolve(null); 
            alert("Please enter your starting position in the form to get directions");
        }
        return deferred.promise;
    };

    stationService.prepareCurrentLocation = function(){ 
        /*
         * This method gets a user's current position, marks it on the map and also stores the lat and lng into
         * our object called currentPosition.
         * We also enter this current position to the From input field in our directions form
         */
        var self = this;
        var deferred = $q.defer();
        var isSuccessful = false;

           alert("prepareCurrentLocation");
            var timeoutVal = 10 * 1000 * 1000;  
            navigator.geolocation.getCurrentPosition(
                function(position){
                    isSuccessful = true;
                    alert("position.coords.latitude " + position.coords.latitude);
                    self.currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    console.log(JSON.stringify(self.currentPosition));
                    var marker = new google.maps.Marker({
                        position: self.currentPosition, 
                        map: self.map, 
                        title:"User location",
                        icon: 'http://gamuzic.com/map_app3/images/you_icon.png',
                       // icon: 'http://localhost/phonegap_tut/images/you_icon.png',
                        optimized: false,
                        zIndex:99999999
                    }); 
                    //return the current position. This will be an object with lat and lng points.
                    deferred.resolve(self.currentPosition); 
                },
                function(error) {
                   
                    alert("Error:"); 
          
                    deferred.resolve(null);    
                }
            );
            $timeout(function() {
                if(!isSuccessful){
                    alert(isSuccessful);
                    deferred.resolve(null);
                }
            }, 2000);
        return deferred.promise;
    };

    stationService.getDirections = function(startLocation, viaPoint, travelMode, destinationStationID){ 
        var self = this;

        //get the travelmode, startpoint and via point from the form   
        var travelMode = travelMode;
        var via = viaPoint;
        if (travelMode == 'TRANSIT') {
            via = '';  //if the travel mode is transit, don't use the via waypoint because that will not work
        }
        alert(JSON.stringify(startLocation));
        alert(JSON.stringify(travelMode));
        alert(JSON.stringify(destinationStationID));
                console.log("self.allStationsMapData " + JSON.stringify(self.allStationsMapData));
        //get the lat and lng points of the station with stationID of destinationStationID.
        var destinationLatLng = self.getStationLatLngPoints(destinationStationID, self.allStationsMapData);

        alert("destinationLatLng " + JSON.stringify(destinationLatLng));
        console.log("destinationLatLng " + JSON.stringify(destinationLatLng));
        
        var waypoints = []; // init an empty waypoints array
        if (via != '' && via != null) {
            console.log("via " + via);
            //if waypoints (via) are set, add them to the waypoints array
            waypoints.push({
                location: via,
                stopover: true
            });
        }
        var request = {
            origin: startLocation,
            destination: destinationLatLng,
            waypoints: waypoints, //delete this if via is not used
            unitSystem: google.maps.UnitSystem.IMPERIAL,
            travelMode: google.maps.DirectionsTravelMode[travelMode]
        };
        self.directionsDisplay = new google.maps.DirectionsRenderer();
        self.directionsDisplay.setMap(self.map);
        self.directionsDisplay.setPanel(document.getElementById("directions_panel"));
        self.directionsService = new google.maps.DirectionsService();

        self.directionsService.route(request, function(response, status){
            if (status == google.maps.DirectionsStatus.OK){
                document.getElementById("directions_panel").innerHTML = "";
                self.directionsDisplay.setDirections(response);
            }else{
                // alert an error message when the route could not be calculated.
                if (status == 'ZERO_RESULTS'){
                    alert('No route could be found between the origin and destination.');
                }else if (status == 'UNKNOWN_ERROR'){ 
                    alert('A directions request could not be processed due to a server error. The request may succeed if you try again.');
                }else if (status == 'REQUEST_DENIED'){
                    alert('This webpage is not allowed to use the directions service.');
                }else if (status == 'OVER_QUERY_LIMIT'){
                    alert('The webpage has gone over the requests limit in too short a period of time.');
                }else if (status == 'NOT_FOUND'){
                    alert('At least one of the origin, destination, or via waypoints could not be geocoded. Please make sure the start location or via point are correct locations');
                }else if (status == 'INVALID_REQUEST'){
                    alert('The Directions Request provided was invalid.');                  
                }else{
                    alert("There was an unknown error in your request. Requeststatus: \n\n"+status);
                }
            }
        });

    };


    stationService.checkForReviews = function(){ 
        /*
         * This method checks to see if the current station has any reviews 
         * i.e. if the reviews property of the stationDetails object is populated or not
         * It returns a boolean.
         * we call this method in the stationController.
         */
        if(this.stationDetails.reviews.length){
            return true;
        }else{
            return false;
        }
    };


    stationService.checkUsersReviewStatus = function(){ 
        /*
         * This method checks to see if the current user has written a review for the current station or not.
         * It returns a boolean.
         * we call this method in the stationController.
         */
        var userHasReviewedStation = false;
        var currentUserID = userFactory.userService.userDetails.userID;
        //loop through the reviews array to check the userID of each review against current userID.
        this.stationDetails.reviews.forEach(function(review) {
            if(review.reviewUserData.userID === currentUserID){
                userHasReviewedStation = true;
            }
        }); 
        console.log("userHasReviewedStation " + userHasReviewedStation);
        return userHasReviewedStation;
    };

    //return public API so that we can access it in all controllers
    return{
        stationService: stationService
    };
});