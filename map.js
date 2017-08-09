var map, marker, sldlOverlay, slduOverlay;
var caCenter, defaultZoom, defaultBounds;
var autocomplete, districtUpper, districtLower, zip; 
var openStates;
var stateDistricts;
var state = 'CA';     //TODO get latlong map zoom defaults
var curOverlay = 'sldl';
var openStatesApiKey = 'INSERT API KEY HERE';
var currentChamber = 'lower';
var currentDistrict;

var slduPath = "./data/ca-sldu.json";
var sldlPath = "./data/ca-sldl.json";
var clipPath = "./data/ca-clip.json";
//TODO - do we st"./data/ca-sldl.json";ill want these initially

var layerID = 'mapbox-light-layer';
var TILE_URL = 'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoid29sZmdhbmctbXB6IiwiYSI6ImNqNXcxYXA1djA4NzIyd29ncmFzbmowZjUifQ.d_D9DGVm9sfiEJilUmR0dw';
//var layerID = 'mapbox-custom-layer';
//var TILE_URL = 'https://api.mapbox.com/styles/v1/wolfgang-mpz/cj5w0hqb270ej2rlds4ij4mtp/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoid29sZmdhbmctbXB6IiwiYSI6ImNqMnczY2xqYjAwZW8zM255MGlwc2g1NWYifQ.dKJgOK8K1MywiRftFeeomA';

//TOOD map inset? use low poly? - create low poly mapbox layer? - need geojson 

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
	initMapboxMap();
	initAutocomplete();
	// initOpenStates(); Add back once we get openestates working.
}

function initOpenStates() {
	openStates = new OpenStates(openStatesApiKey);
	console.log(openStates.api_key);
	var state_lower = state.toLowerCase();
	stateDistricts = new DistrictList(openStates.getDistricts(state_lower), state_lower);
	// Preload all district info. Takes about 15 seconds for CA.
	stateDistricts.preloadDistricts();
}

function initMapboxMap(){
  L.mapbox.accessToken = 'pk.eyJ1Ijoid29sZmdhbmctbXB6IiwiYSI6ImNqNXcxYXA1djA4NzIyd29ncmFzbmowZjUifQ.d_D9DGVm9sfiEJilUmR0dw';
  map = L.mapbox.map('map', 'mapbox.light');
  resetMapboxMap();
    


    //todo needs ca outline
    //todo add custom layers


    //TODO needs reset map
    //todo needs zoom map

}

function initGoogleMap() {
	defaultZoom = 6;
	caCenter = new google.maps.LatLng(37.2719, -119.2702);
	defaultBounds = new google.maps.LatLngBounds(
  		new google.maps.LatLng(32.5343, -124.4096),
  		new google.maps.LatLng(42.0095, -114.1308));
	
	// Create a map object and specify the DOM element for display.
		map = new google.maps.Map(document.getElementById('map'), {
                center: caCenter,
                scrollwheel: true,
                zoom: defaultZoom,
                disableDefaultUI: true,
                mapTypeControl: false,
                scaleControl: true,
                zoomControl: true,

		});
		addCustomTiles(map);
		addGeoJsonLayers(map);
		addCustomControls(map);
}

function addGeoJsonLayers(map){
	
  clipOverlay = new google.maps.Data();
	sldlOverlay = new google.maps.Data();
	slduOverlay = new google.maps.Data();

  sldlOverlay.loadGeoJson(sldlPath);
  slduOverlay.loadGeoJson(slduPath);
  clipOverlay.loadGeoJson(clipPath);

  //TODO style initial map layers
  sldlOverlay.setStyle({
    strokeColor: 'red',
    strokeWeight: 2
   });

  slduOverlay.setStyle({
    strokeColor: 'black',
    strokeWeight: 1
  });

  clipOverlay.setStyle({
    fillColor: 'black',
  });
	

  sldlOverlay.setMap(map);
  slduOverlay.setMap(map);
  clipOverlay.setMap(map);
	
}

function addCustomTiles(map){
	   // Create a tile layer, configured to fetch tiles from TILE_URL.
      layer = new google.maps.ImageMapType({
        name: layerID,
        getTileUrl: function(coord, zoom) {
          var url = TILE_URL
            .replace('{x}', coord.x)
            .replace('{y}', coord.y)
            .replace('{z}', zoom);
          return url;
        },
        tileSize: new google.maps.Size(256, 256),
        minZoom: 1,
        maxZoom: 20
      });
      
      // Apply the new tile layer to the map.
      map.mapTypes.set(layerID, layer);
      map.setMapTypeId(layerID);
	
}

function addCustomControls(map){
	
	var controlDivReset = document.createElement('div');
	var resetControl = new ResetControl(controlDivReset, map);
	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDivReset);
	
  //TODO create toggle upper vs lower house map layer
	/*
	var controlDivOverlay = document.createElement('div');
	var overlayControl = new ResetControl(controlDivOverlay, map);
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDivOverlay);
 */
}

function resetMapboxMap(){
  console.log( 'reset map');
  map.setView([37.2719, -119.2702], 6);
  document.getElementById('autocomplete').value = '';

}

function resetGoogleMap(){
  console.log( 'reset map');

  if (marker) { marker.setMap(null) }
  map.setCenter(caCenter);
  map.setZoom(defaultZoom);
  document.getElementById('autocomplete').value = '';

}

function resetDistrictInfo(){
  //TODO 

  //temp
  districtUpper, districtLower, zip = '';


  //TODO clear mailchimp section

}

function ResetControl(controlDiv, map) {

  //todo add to css file
  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#fff';
  controlUI.style.border = '2px solid #fff';
  controlUI.style.borderRadius = '3px';
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlUI.style.cursor = 'pointer';
  controlUI.style.margin = '10px';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Click to reset the map';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlText = document.createElement('div');
  controlText.innerHTML = 'Reset Map';
  controlUI.appendChild(controlText);

  controlUI.addEventListener('click', resetGoogleMap());
}

function initAutocomplete() {
        // Create the autocomplete object, restricting the search to geographical
        // location types.
        autocomplete = new google.maps.places.Autocomplete(
            /** @type {!HTMLInputElement} */(document.getElementById('autocomplete')),
            {types: ['geocode']});

        autocomplete.addListener('place_changed', getDistrictInfo);
      }

function OpenStates(api_key) {
	this.openStatesURL = 'https://openstates.org/api/v1';
	this.api_key = '' + api_key;
}


function District(json) {
	this.abbr = json.abbr;
	this.boundary_id = json.boundary_id;
	this.chamber = json.chamber;
	this.id = json.id;
	this.legislators = json.legislators;
	this.num_seats = json.num_seats;
	this.boundary = null;
}

District.prototype.getBoundary = function() {
	if (!this.boundary) {
		var json = openStates.getDistrictBoundary(this.boundary_id);
		if (json) {
			this.boundary = this;
			this.bbox = json.bbox;
			this.region = json.region;
			this.shape = json.shape;
		}
	}
	return this.boundary;
}

function DistrictList(json, state) {
	var district;
	this.upper_districts = [];
	this.lower_districts = [];
	this.state = state;
	this.num_districts = json.length;
	this.num_districts = 4;
	this.districts = {};
	this.district_ids = [];
	for (var i in json) {
		district = new District(json[i]);
		this.districts[district.id] = district;
		this.district_ids.push[district_id];
		if (district.chamber == 'upper') {
			this.upper_districts[parseInt(district.name)] = district;
		} else if (district.chamber == 'lower') {
			this.lower_districts[parseInt(district.name)] = district;
		}
	}
	this.populated = false;
	this.populator = new DistrictPopulator(this);
}

function DistrictPopulator (districtList) {
	this.districtList = districtList;
	this.currentDistrict = 0;
}

DistrictPopulator.prototype.populate = function() {
	if (this.currentDistrict < this.districtList.num_districts) {
		var district_id = this.districtList.district_ids[this.currentDistrict];
		this.districtList.districts[district_id].getBoundary();
		console.log('Populating ' + district_id);
		this.currentDistrict++;
		setTimeout(this.populate, 100);
	}
}

DistrictList.prototype.findNearbyDistricts = function () {
	var nearby = [];
	nearby.push(this.lower_districts[0]);
	nearby.push(this.upper_districts[0]);
	return nearby;
}

DistrictList.prototype.preloadDistricts = function () {
	if (!this.populated) {
		this.populated = true;
		this.populator.populate();
	}
}

DistrictList.prototype.createDistrictId = function (state, chamber, number) {
	return state + '-' + chamber + '-' + number;
}

DistrictList.prototype.getDistrict = function (chamber, number) {
	return this.districts[this.createDistrictId(this.state, this.chamber, this.number)];
}

OpenStates.prototype.makeUrl = function(method) {
	return this.openStatesURL + '/' + method + '/' + "?apikey=" + this.api_key;
}

OpenStates.prototype.callApi = function (url) {
	var xhr = new XMLHttpRequest;
	xhr.open('GET', url, false);
	xhr.setRequestHeader('X-API-KEY', this.api_key);
	xhr.send();
	return JSON.parse(xhr.responseText);
}

OpenStates.prototype.getDistricts = function (state, chamber) {
	var method = 'districts/' + state;
	if (chamber) {
		method += '/' + chamber;
	}
	return this.callApi(this.makeUrl(method));
}

OpenStates.prototype.getDistrictBoundary = function (boundary_id) {
	var method = 'districts/boundary/' + boundary_id;
	return this.callApi(this.makeUrl(method));
}

function updateUpperLower(possibleDistricts) {
	var district;
	for (var d in possibleDistricts) {
		district = possibleDistricts[d];
		if (district.chamber == 'lower') {
			districtLower = district;
		} else if (district.chamber == 'upper') {
			districtUpper = district;
		}
	}
	if (currentChamber == 'upper') {
		currentDistrict = districtUpper;
	} else {
		currentDistrict = districtLower;
	}
}

function getDistrictInfo(){

        // Get the place details from the autocomplete object.
	var place = autocomplete.getPlace();

	var lat = place.geometry.location.lat();
  var lng = place.geometry.location.lng();

  console.log(lat);
  console.log(lng);
	
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
		
	console.log('TODO - GET DISTRICTS') 
  var boundary = [];
	//  possibleDistricts = stateDistricts.findNearbyDistricts(lat, lng);
	//  console.log('Possible Districts');
	//  console.log(possibleDistricts);
	//  // TODO - actually find correct district instead of just picking
	//  // closest center within bounding box.
	//  updateUpperLower(possibleDistricts);
	//  console.log('Lower district:' + districtLower.id);
	//  console.log(districtLower);
	//  console.log('Upper district:' + districtUpper.id);
	//  console.log(districtUpper);
	//  console.log('current district:' + districtUpper.id);
	//  zoomDistrict(place, currentDistrict);
  //TODO - call openStates
  //TODO - set cookies or local storage

 // var testLower = JSON.parse('/data/sldl17.json');

  //TODO update mailchimp hidden fields

  //TODO update to use bounding box for district
  //zoomGoogleDistrict(place);
	zoomMapBoxDistrict(lat, lng, boundary);
 }

 function zoomMapboxDistrict(place,boundary){

  //fitBounds(<LatLngBounds> bounds, <fitBounds options> options?)

 }

// Add back once openstates works.
// function zoomDistrict(place, district){
function zoomGoogleDistrict(place){
	
	//TODO zoom to district bounding box
  var tmpZoom = 8;
  marker = new google.maps.Marker({
          map: map,
          anchorPoint: new google.maps.Point(0, -29)
        });
  /*
     if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
     } else {
  	 */
    map.setCenter(place.geometry.location);
    map.setZoom(tmpZoom);  
      //    }
    marker.setPosition(place.geometry.location);
    marker.setVisible(true);
	
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
