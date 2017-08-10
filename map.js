var map, marker, markers, districts;
var caCenter = [37.2719, -119.2702];
var defaultZoom = 6;
var caBounds = [ [32.5343, -124.4096], [42.0095, -114.1308]];
var autocomplete, districtUpper, districtLower, zip; 
var openStates;
var stateDistricts;
var state = 'CA';     //TODO get latlong map zoom defaults
var openStatesApiKey = 'INSERT API KEY HERE';
var currentChamber = 'lower';
var currentDistrictLower;
var currentDistrictUpper;

// Copied from https://www.html5rocks.com/en/tutorials/cors/
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {

    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.
    xhr.open(method, url, true);

  } else if (typeof XDomainRequest != "undefined") {

    // Otherwise, check if XDomainRequest.
    // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
    xhr = new XDomainRequest();
    xhr.open(method, url);

  } else {

    // Otherwise, CORS is not supported by the browser.
    xhr = null;

  }
  return xhr;
}


function init() {

	initAutocomplete();
	initOpenStates();  //async
  initMap();
}

function initOpenStates() {
	// openStates = new OpenStates(openStatesApiKey)
	openStates = new LocalOpenStates();
	var state_lower = state.toLowerCase();
	// calls are currently syncronous. Avoid synchronous call by launching a new thread.
	setTimeout(function () {
		stateDistricts = new DistrictList(openStates.getDistricts(state_lower), state_lower);
		stateDistricts.preloadDistricts();
	}, 10);
	
}

function initMap(){
  L.mapbox.accessToken = 'pk.eyJ1Ijoid29sZmdhbmctbXB6IiwiYSI6ImNqNXcxYXA1djA4NzIyd29ncmFzbmowZjUifQ.d_D9DGVm9sfiEJilUmR0dw';
  map = L.mapbox.map('map', 'mapbox.light');
  map.fitBounds(caBounds);

  markers = L.featureGroup();
  map.addLayer(markers);



  myDistricts = L.layerGroup();
  map.addLayer(myDistricts);

  map.on('click', function(e){
      var pos = e.latlng;
      setPosition( pos.lat, pos.lng );

      document.getElementById('autocomplete').value = '';

  });


  resetMap();

  //TODO needs ca outline
}


function resetMap(){
  markers.clearLayers();
  myDistricts.clearLayers();
  map.flyToBounds(caBounds);
  document.getElementById('autocomplete').value = '';

}

function resetDistrictInfo(){
  //TODO 

  //temp
  districtUpper, districtLower, zip = '';


  //TODO clear mailchimp section

}

function initAutocomplete() {
        // Create the autocomplete object, restricting the search to geographical
        // location types.
        autocomplete = new google.maps.places.Autocomplete(
            /** @type {!HTMLInputElement} */(document.getElementById('autocomplete')),
            {types: ['geocode']});

        autocomplete.addListener('place_changed', getAutocompletePlace);
      }


function updateUpperLower(possibleDistricts, lat, lon) {
	var district;
	var foundUpper = false;
	var foundLower = false;
	for (var d in possibleDistricts) {
		district = possibleDistricts[d];
		if (!foundLower && district.chamber == 'lower' && district.surroundsPointExact(lat, lon)) {
			districtLower = district;
		} else if (!foundUpper && district.chamber == 'upper' && district.surroundsPointExact(lat, lon)) {
			districtUpper = district;
		}
	}
	if (currentChamber == 'upper') {
		currentDistrict = districtUpper;
	} else {
		currentDistrict = districtLower;
	}
}

function getAutocompletePlace(){
  var place = autocomplete.getPlace();

  var lat = place.geometry.location.lat();
  var lng = place.geometry.location.lng();
  
  for (var i = 0; i < place.address_components.length; i++) {
      for (var j = 0; j < place.address_components[i].types.length; j++) {
        if (place.address_components[i].types[j] == "administrative_area_level_1") {
            state = place.address_components[i].short_name;
            console.log(state)
        }
        if (place.address_components[i].types[j] == "postal_code") {
            zip = place.address_components[i].long_name;
            console.log(zip)
        }
      }
    }
    setPosition( lat, lng );
}



function getDistrictInfo(lat, lng){
        // Get the place details from the autocomplete object.

	console.log('GET DISTRICTS') 
	possibleDistricts = stateDistricts.findNearbyDistricts(lat, lng);  //zoom district 
	console.log('Possible Districts');
	console.log(possibleDistricts);
	// TODO - actually find correct district instead of just picking
	// closest center within bounding box.
	updateUpperLower(possibleDistricts, lat, lng);
	console.log('Lower district:' + districtLower.id);
	console.log(districtLower);
	console.log('Upper district:' + districtUpper.id);
	console.log(districtUpper);
	console.log('current district:' + districtUpper.id);
  //TODO - call openStates
  //TODO - set cookies or local storage
  //TODO update mailchimp hidden fields
	
 }

  function setPosition(lat, lng){
    resetDistrictInfo();
    markers.clearLayers();
    marker = L.marker([lat,lng],{ draggable: true });
    marker.on('dragend', function(e){
       var pos = e.target.latlng;
        getDistrictInfo(lat,lng);
        zoomDistrict();  //make this a callback if get district info
    });
    markers.addLayer(marker);
        
    getDistrictInfo(lat,lng);
    zoomDistrict();  //make this a callback


 }

 function drawDistrict( district, districtColor ){

      var shape = district.shape;

      for (i = 0; i < shape.length; i++) { 
        var boundary = shape[i][0].slice(1).map(function(x) { return [x[1],x[0]]; });  //assumes no donuts
        shape[i] = boundary;
      }

      var polygon = L.polygon(shape, {color: districtColor });
      myDistricts.addLayer( polygon );  //todo name layer ?

 }

//TODO deal with upper and lower 
 function zoomDistrict(){

  var bbox = districtUpper.bbox;  //TODO get bbox of both bboxes

  var drawNewDistrict = true;
  map.flyToBounds(bbox);

//todo make this map.on('zoomend', function() {
  //todo check if changed districts
  myDistricts.clearLayers();
  drawDistrict(districtUpper, 'blue');
  drawDistrict(districtLower, 'red');
  

 }

// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var geolocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            var circle = new google.maps.Circle({
              center: geolocation,
              radius: position.coords.accuracy
            });
            autocomplete.setBounds(circle.getBounds());
          });
        }
      }
