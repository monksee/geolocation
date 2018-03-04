/*
 * This factory consists of 
 */
mapApp.factory('googleMapsFactory', function($http, $timeout, $q, $compile, sharedFactory, stationFactory, geolocationFactory, appFactory){
    "use strict";

    var googleMapsService = {};

        //variables which will hold data related to the google map.
    googleMapsService.map;
    googleMapsService.infoWindow;
    googleMapsService.infoWindowContent;

    googleMapsService.directionsDisplay;
    googleMapsService.directionsService;
    //we create an object which will store the latest directions result (whenever calculated in the getDirections method of this factory),
    //so that we can use the result at a later stage (i.e any time the home view is loaded we insert this result to the directions_panel once again)
    googleMapsService.directionsResult = {};

    //create an array to hold the station markers. we need to do this in order to create the marker clusters.
    googleMapsService.stationMarkers = [];

    googleMapsService.currentPositionMarkers = [];


    googleMapsService.prepareGoogleMapsApi = function(callback){
        /* Before using the google object (i.e when preparing the google map and also when getting directions) 
         * we must check if the google api is fully loaded (otherwise there will be an error ("google" undefined) 
         * that can break the app from working on subsequent requests).
         * (in case the user was not online when they opened the app or the requests where made).
         */

        var deferred = $q.defer();
        var isSuccessful = false;
        //make sure the user is online before proceeding with loading the google map script (if not loaded already) and also running our callback.
        var userIsOnline = navigator.onLine;
        if(userIsOnline){
            if(mapsApiIsLoaded){
                callback();
            }else{
            	//If the maps API has not been loaded yet then make a http request to the googleMapAPIkey endpoint to retrieve our google maps API key 
            	//from the server. (Note: We retrieve it from the server for more security)
                console.log("not loaded");
               // var googleMapAPIKey = "AIzaSyAq3rgVX-gPP-1TWmUBER0f_E_tzGO_6Ng"; 
                $http({ 
                    method: 'GET',
                   // url: 'http://localhost/API/deleteReply/' + replyID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                    url: appFactory.appService.appDetails.appRootURL + '/API/googleMapAPIKey?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    responseType:'json'
                    }).then(function successCallback(response){
                        console.log(JSON.stringify(response.data.googleMapAPIKey));

                        var googleMapAPIKey = response.data.googleMapAPIKey;
                        //Now that we have the google maps API Key we can load the google maps API with the loadScript method. 
                        //We will call the mapsCallback function (after the google maps API is loaded) in order to set mapsApiIsLoaded to true
                        var url = "http://maps.google.com/maps/api/js?key=" + googleMapAPIKey + "&callback=mapsCallback"; 
                        googleMapsService.loadScript(url, callback);
                    },function errorCallback(response){
                        sharedFactory.buildErrorNotification(response);
                        return null;
                });

            }
        }else{
            //only resolve the promise if the map API did not load successfully.

            deferred.resolve(isSuccessful); 
            alert("No Internet Connection!");
        }
        return deferred.promise;
    };


    googleMapsService.loadScript = function(url, callback){
        // Adding the script tag to the head as suggested before
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        // Then bind the event to the callback function.
        // There are several events for cross browser compatibility.
        script.onreadystatechange = callback;
        script.onload = callback;

        // Fire the loading
        head.appendChild(script);
    };

    googleMapsService.prepareStationsOnMap = function(allStationsMapData, scope, location){ 
        /*
         * This method takes in data for all our station data and pinpoints the station locations on a google map with id of map.
         * We use this in our main controller after we have detected that the home view has finished loading.
         */
        var self = this;
        var deferred = $q.defer();

        var mapLoadedSuccessfully = false;

        //store the map and infowindow in global variables so we can retrieve it later if we want
        self.infoWindow = new google.maps.InfoWindow();

        self.map = new google.maps.Map(document.getElementById('map'),{
            zoom: 7,
            center: allStationsMapData[0].stationLatLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false
        });
   
        google.maps.event.addListenerOnce(self.map, 'tilesloaded', function(){
            //when the map is finished loading we resolve the promise returning the fact that the map has loaded successfully.
            mapLoadedSuccessfully = true;
            deferred.resolve(mapLoadedSuccessfully); 
            //fix the map now that it is loaded i.e get all of the google links embedded into the map and make them open in a new window.
            //We need to do this so that the user can navigate back in a phonegap app.
            self.fixMapWhenLoaded(); 
        });
        var stationIcon = new google.maps.MarkerImage(appFactory.appService.appDetails.appRootURL + "/map_server_files/images/gm_icon_petrol_pump.png", null, null, null, new google.maps.Size(48,68));


        for(var i = 0; i < allStationsMapData.length; i++){
            (function(stationMapData){
                var infoWindowHTMLContent = self.generateInfoWindowContent(stationMapData.stationID, stationMapData.stationName, stationMapData.stationLatLng);
                var compiled = $compile(infoWindowHTMLContent)(scope);
                var marker = new google.maps.Marker({
                   // map: self.map,
                    position: stationMapData.stationLatLng,
                    stationID: stationMapData.stationID,
                    stationName: stationMapData.stationName,
                    icon: stationIcon,
                   // icon: 'http://localhost/phonegap_tut/images/icon.png',
                    content: compiled[0],
                });

                // Push your newly created marker into the array
                self.stationMarkers.push(marker);
      

                google.maps.event.addDomListener(marker, 'click', function(){
                    self.infoWindow.setContent(this.content);
                    self.infoWindow.open(self.map, this);
                });
            })(allStationsMapData[i]);

        }
        //set style options for marker clusters (these are the default styles)
        var mcOptions = {styles: [{
                        height: 75,
                        url: appFactory.appService.appDetails.appRootURL + "/map_server_files/images/gm_icon_marker_cluster_light.png",
                        width: 75,
                        textColor: '#ffffff',
                        textSize:14
                    }]};
        // create the markerClusterer
        var markerCluster = new MarkerClusterer(self.map, self.stationMarkers, mcOptions);
       // console.log(markerCluster);
        
        $timeout(function() {

            if(!mapLoadedSuccessfully){
            	//if after 6 seconds of calling this prepareStationsOnMap method the map hasn't loaded we resolve the promise
            	//so that we can update the scope. mapLoadedSuccessfully will still be false since it was initially defined.
               alert('timeout2 ' +  mapLoadedSuccessfully);
                deferred.resolve(mapLoadedSuccessfully);
            }
        }, 6000);

        return deferred.promise;

    };


    googleMapsService.fixMapWhenLoaded = function() {
        /*
         * We need to target all external links within the google map so that we can open them in a new window instead of the
         * default behaviour.
         * Leaving the default behaviour causes the following problem when the app is packaged with phonegap:
         * The user clicks the external link but has no way to navigate back to the app.
         * By changing the default external link behaviour we can have the link open in an in-app browser window so that
         * they can navigate back to the app
         */

        //Now that the map has loaded, get all anchor links with href containing google.com 
        //These will be the "google" logo link, the "terms and conditions" link and the "report an error" link on the map
        var google_map_links = document.querySelectorAll("a[href*='google.com']");
        console.log(google_map_links);
        googleMapsService.fixExternalLinks(google_map_links);
    };


    googleMapsService.fixExternalLinks = function(external_links) {
        console.log(external_links);
        for(var i = 0; i < external_links.length; i++){
            //create a closure to add on click event listeners to each link
            (function(external_link){
                external_link.addEventListener('click', function(event){
                    //prevent the default action on link click
                    event.preventDefault();
                    var href = external_link.getAttribute("href"); //get the href attribute of this element
                    //open the link in a new window (which will then allow the user to navigate back to the app)
                    var ref = window.open(href, '_blank', 'location=yes');
                }, false);
                console.log(external_link);
            })(external_links[i]);
        }

    };


    googleMapsService.generateInfoWindowContent = function(stationID, stationName, stationLatLng){ 
        /*
         * This method prepares HTML for the content of the google map info winodw (i.e the popups that come up when you click 
         * on a marker).
         * This method is called in prepareStationsOnMap.
         */
        var infoWindowHTML = '<div class="info_window"><h4 class="station_name">' + stationName + '</h4>' + 
                             '<div class="info_window_button_area">' + 
                             '<a class="info_window_button btn btn_white" href="#station?stationID=' + stationID + '">View more info</a>' + 
                             '<span class="info_window_button btn btn_white" + data-ng-click="getDirections(' + stationID + ')">Get directions</span>' + 
                             '</div>' +
                             '</div>';

        return infoWindowHTML;
    };

    googleMapsService.prepareCurrentLocation1 = function(){ 
        /*
         * This method gets a user's current position, marks it on the map
         * We also enter this current position to the From input field in our directions form
         */
        var self = this;
        for(var i = 0; i < self.currentPositionMarkers.length; i++){
            self.currentPositionMarkers[i].setMap(null);
        }
        var deferred = $q.defer();
        var isSuccessful = false;
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(
                function(position){
                    isSuccessful = true;
                    var currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    console.log(JSON.stringify(currentPosition));
                    var currentLocationIcon = new google.maps.MarkerImage(appFactory.appService.appDetails.appRootURL + "/map_server_files/images/gm_icon_user.png", null, null, null, new google.maps.Size(48,68));
                    var currentPositionObject = {"lat": position.coords.latitude, "lng": position.coords.longitude};


                    var currentPositionMarker = new google.maps.Marker({
                        position: currentPosition, 
                        map: self.map, 
                        title:"User location",
                        icon: currentLocationIcon,
                       // icon: 'http://localhost/phonegap_tut/images/you_icon.png',
                        optimized: false,
                        zIndex:99999999
                    }); 
                    // Push your newly created marker into the array
                    self.currentPositionMarkers.push(currentPositionMarker);
                    //return the current position. This will be an object with lat and lng points.
                    deferred.resolve(currentPositionObject); 
                },
                function(error) {
                    var errors = { 
                        1: 'Permission denied',
                        2: 'Position unavailable',
                        3: 'Request timeout'
                    };
                    if(errors[error.code] == 'Permission denied'){
                        //alert("Error: Current location inaccessible. Please ensure location services are enabled in the settings on your device."); 
                    }else{
   
                        //alert("Error: " + errors[error.code] + ". Please enter your starting position in the form to get directions");
                    }  
                    deferred.resolve(null);    
                },
              { enableHighAccuracy: true, timeout: 5900, maximumAge: 0 }
            );
            $timeout(function() {
                //After two seconds check if the isSuccessful boolean is still false and if so then 
                //we know the success callback has not been executed so we can resolve the promise passing in null
                if(!isSuccessful){
              
                    deferred.resolve(null);
                }
            }, 6000);


        }else{
            deferred.resolve(null); 
            alert("Please enter your starting position in the form to get directions");
        }
        return deferred.promise;
    };

    googleMapsService.prepareCurrentLocation = function(){ 
        /*
         * This method calls the getCurrentPosition method from the geolocationFactory to get a user's current position
         * If successfully retrieved we mark their current position on the map (with id of "map")
         * and return the current position from the method with a promise.
         * If unsuccessful we return null.
         */
        var self = this;
        for(var i = 0; i < self.currentPositionMarkers.length; i++){
            self.currentPositionMarkers[i].setMap(null);
        }
  
        var deferred = $q.defer();
        var isSuccessful = false; //initialize a boolean which will tell us whether the success function has been executed or not.
          // alert("prepareCurrentLocation");
            geolocationFactory.getCurrentPosition(
                function(position){
                    isSuccessful = true;

                    var currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    var currentLocationIcon = new google.maps.MarkerImage(appFactory.appService.appDetails.appRootURL + "/map_server_files/images/gm_icon_user.png", null, null, null, new google.maps.Size(48,68));
                   var currentPositionObject = {"lat": position.coords.latitude, "lng": position.coords.longitude};

                    console.log(JSON.stringify(currentPosition));

                    var currentPositionMarker = new google.maps.Marker({
                        position: currentPosition, 
                        map: self.map, 
                        title:"User location",
                        icon: currentLocationIcon,
                       // icon: 'http://localhost/phonegap_tut/images/you_icon.png',
                        optimized: false,
                        zIndex:99999999
                    }); 
                    // Push your newly created marker into the array
                    self.currentPositionMarkers.push(currentPositionMarker);
                    //return the current position. This will be an object with lat and lng points.
                    deferred.resolve(currentPositionObject); 
                },
                function(error) {
                    //we will output a message to the user in the controller as
                    //a different message will be output depending on when this method is called
                    deferred.resolve(null);    
                },
                { enableHighAccuracy: true, timeout: 5900, maximumAge: 0 }
            );
            //Note: After testing with phonegap it seems the error function is sometimes not being called here 
            //for example when a user has location turned off on their device so 
            //we need another way to return null (from the promise) if the success function is not called.
            //we do this with a timeout.
            $timeout(function() {
                //After two seconds check if the isSuccessful boolean is still false and if so then 
                //we know the success callback has not been executed so we can resolve the promise passing in null
                if(!isSuccessful){
                    //alert('stationfactory getcurrentloc timeout');
                    deferred.resolve(null);
                }
            }, 6000);
        return deferred.promise;
    };

    googleMapsService.getLatLng = function(address){ 
    	/*
         * This method takes in an address as a parameter and calls the google maps geocode method in order to get the 
         * lat and lng co-ordinates for that address.
         * We will call this method in the main controller if the user chooses to enter a start location and also 
         * has requested to get directions to the nearest station.
         * We return an object with lat and lng values with a promise
         */
    	var deferred = $q.defer();
        var latLng = {};
        var geocoder = new google.maps.Geocoder();
        //restrict the result to Irish addresses
        geocoder.geocode( { 'address': address, componentRestrictions: {country: 'IRELAND'}}, function(results, status) {
            if(status == 'ZERO_RESULTS'){
                alert('The start location entered is not recognised as a valid address. \n\nPlease try again.');        
            }else if (status == google.maps.GeocoderStatus.OK) {
            	//status is ok
                var latitude = results[0].geometry.location.lat();
                var longitude = results[0].geometry.location.lng();
                latLng = {"lat": latitude, "lng": longitude};
                //return the lat lng object
                deferred.resolve(latLng);
            } 
        }); 
        return deferred.promise;
    };

    googleMapsService.getNearestStation = function(startLocation, allStationsMapData){
    	/*
    	 * This method uses the haversine algorithm for calculating the distance between two points (with latitude and longtitude values).
    	 * We call methods from the latlon-spherical.js and dms.js files.
         * We take in a startLocation object (with lat and lng values) and the allStationsMapData array as parameters.
         * We calculate the distance between the startLocation and each petrol station. We return the station ID with the smallest distance.
         */

        //the stationIDs array will store the station ID for each destination petrol station.
        var stationIDs = [];
        //the distances array will store the distances between the startLocation we take in and each petrol station. 
        var distances = [];

        //create a LatLon object (which is defined in the latlon-spherical.js file) so that we can use it with the distanceTo method as seen below.
        var startingPoint = new LatLon(parseFloat(startLocation.lat), parseFloat(startLocation.lng));
        console.log(startingPoint);
        //iterate through the allStationsMapData array in order to get the lat and lng points of each station
        allStationsMapData.forEach(function(stationMapData){
            var endPoint = new LatLon(parseFloat(stationMapData.stationLatLng.lat), parseFloat(stationMapData.stationLatLng.lng));
            //calculate the distance from the starting point to the current station endpoint
            var distance = startingPoint.distanceTo(endPoint);
            //push the distance onto the distances array
            distances.push(distance);
            stationIDs.push(parseInt(stationMapData.stationID));
        });
        console.log("distances " + distances);
        console.log("distances.min()" + distances.min());
        //get the minimum value from the distances array using the min() method and in turn
        //get the index of the distances array which holds the element with that value.
        var minDistanceIndex = distances.indexOf(distances.min());
        //get the station ID from the stationIDs array using the minDistanceIndex.
        //This will be the nearest station ID to the starting point which we took in as a parameter.
        var nearestStationID = stationIDs[minDistanceIndex];
        console.log("nearestStationID" + nearestStationID); 
        //return the station ID of the nearest station
        return nearestStationID;
    };



    googleMapsService.getDirections = function(startLocation, viaPoint, travelMode, destinationStationID){ 
        /*
    	 * This method takes in a startLocation, viaPoint, travelMode and destinationStationID and uses the google maps directions service
    	 * in order to calculate the directions from the starting point to the endpoint.
    	 */
        var self = this;
        var deferred = $q.defer();
        var via = viaPoint;
        console.log("strt" + JSON.stringify(startLocation));
        //startLocation is already in the LatLng Object format so we don't need to create an object with: "new google.maps.LatLng(lat, lng);"

        if (travelMode == 'TRANSIT') {
            via = '';  //if the travel mode is transit, don't use the via waypoint because that will not work
        }

        //get the lat and lng points (from the database) of the station with stationID of destinationStationID.
        var destinationLatLng = stationFactory.stationService.getStationLatLngPoints(destinationStationID, stationFactory.stationService.allStationsMapData);
        //get the station name of the station with stationID of destinationStationID.
        var stationName = stationFactory.stationService.getStationName(destinationStationID, stationFactory.stationService.allStationsMapData);

        var directionsDetails = {};
        if(travelMode === "TRANSIT"){
            directionsDetails.travelMode = "Public transport";
        }else{
            directionsDetails.travelMode = travelMode;
        }
        directionsDetails.stationName = stationName;
        
        var waypoints = []; // init an empty waypoints array
        if (via != '' && via != null) {
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

        //check first that the user is online.
        var userIsOnline = navigator.onLine;
        if(userIsOnline){
            //reset the directionsDisplay if it is already set (e.g from previous direction results)
            if(self.directionsDisplay != null){
                self.directionsDisplay.setMap(null);
                self.directionsDisplay = null;
            }

            self.directionsDisplay = new google.maps.DirectionsRenderer();
            self.directionsDisplay.setMap(self.map);
            self.directionsDisplay.setOptions( { suppressMarkers: true } );
            self.directionsDisplay.setPanel(document.getElementById("directions_panel"));

            self.directionsService = new google.maps.DirectionsService();
            self.directionsService.route(request, function(response, status){
                // alert('route called');
                if(status == google.maps.DirectionsStatus.OK){
                    // alert('status ok');
                    document.getElementById("directions_panel").innerHTML = "";
                    self.directionsDisplay.setDirections(response);
                    self.directionsResult = response;

                    console.log(typeof response);
                    deferred.resolve(directionsDetails);
                }else{
                    // alert('status not ok');
                    // alert an error message when the route could not be calculated.
                    if(status == 'ZERO_RESULTS'){
                        alert('No route could be found between the origin and destination. \n\nPlease make sure the origin, destination, and via waypoints are correct locations.');
                    }else if(status == 'UNKNOWN_ERROR'){ 
                        alert('A directions request could not be processed due to a server error. \n\nPlease check your internet connection.');
                    }else if(status == 'REQUEST_DENIED'){
                        alert('This application is not allowed to use the directions service. \n\nPlease contact support!');
                    }else if(status == 'OVER_QUERY_LIMIT'){
                        alert('The application has gone over the requests limit in too short a period of time.\n\nPlease contact support!');
                    }else if(status == 'NOT_FOUND'){
                        alert('At least one of the origin, destination, or via waypoints could not be geocoded. \n\nPlease make sure the start location or via point are correct locations.');
                    }else if(status == 'INVALID_REQUEST'){
                        alert('The Directions Request provided was invalid.');                  
                    }else{
                        alert("There was an unknown error in your request. Request status: \n\n" + status);
                    }
                    deferred.resolve(null);
                }
            });
        }else{
            deferred.resolve(null);
            alert("No internet connection! \n\nPlease take the following steps: \n\n 1. Make sure mobile data or Wi-Fi is turned on. \n\n 2. Make sure aeroplane mode is off. \n\n 3. Check the signal in your area.");
        }
        return deferred.promise;
    };


    //return public API so that we can access it in all controllers
    return{
        googleMapsService: googleMapsService
    };

});