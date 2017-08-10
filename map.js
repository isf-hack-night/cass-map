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

var testlat = 37.819027000000006;
var testlng = -122.372781;
var testshape = [[[[-122.463782,37.758538],[-122.463226,37.758562],[-122.463386,37.759222],[-122.462792,37.759736],[-122.462972,37.762316],[-122.457536,37.763566],[-122.45779,37.766015],[-122.456913,37.765874],[-122.452947,37.766374],[-122.454683,37.774755],[-122.433219,37.77749],[-122.435486,37.788697],[-122.42242,37.790358],[-122.425488,37.80601],[-122.426613,37.808152],[-122.426527,37.809905],[-122.425875,37.810521],[-122.424876,37.810799],[-122.425902,37.812057],[-122.425182,37.812628],[-122.448682,37.808628],[-122.453983,37.839027],[-122.418673,37.852505],[-122.422683,37.878126],[-122.432283,37.929824],[-122.373782,37.883725],[-122.367781,37.866726],[-122.346681,37.811027],[-122.28178,37.70823],[-122.381081,37.708431],[-122.420082,37.708231],[-122.423377,37.709203],[-122.42504,37.710543],[-122.428808,37.712126],[-122.434059,37.713205],[-122.440999,37.716488],[-122.432808,37.727315],[-122.428038,37.732016],[-122.430948,37.732338],[-122.439314,37.729936],[-122.439735,37.730376],[-122.439743,37.731634],[-122.453411,37.731568],[-122.453425,37.73304],[-122.448873,37.733069],[-122.448898,37.735797],[-122.448504,37.736389],[-122.449335,37.736685],[-122.449464,37.738016],[-122.450031,37.737835],[-122.45078,37.738214],[-122.451446,37.737746],[-122.452335,37.737648],[-122.453652,37.736659],[-122.45435,37.737136],[-122.45584,37.737385],[-122.45728,37.738431],[-122.459592,37.738533],[-122.459156,37.73914],[-122.458082,37.739099],[-122.457725,37.740066],[-122.455374,37.741251],[-122.453644,37.743312],[-122.451982,37.742797],[-122.449934,37.74297],[-122.449861,37.743265],[-122.451692,37.745629],[-122.453829,37.745724],[-122.456224,37.746558],[-122.458743,37.746876],[-122.459174,37.747286],[-122.458712,37.747605],[-122.458662,37.748038],[-122.460352,37.749783],[-122.461313,37.75135],[-122.463711,37.753618],[-122.463782,37.758538]]]];
var testbbox = [[37.70823,-122.463782],[37.929824,-122.28178]];

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
	initMap();
	initAutocomplete();
	initOpenStates();
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

  myDistricts = L.layerGroup();
  map.addLayer(myDistricts);
  markers = L.featureGroup();
  map.addLayer(markers);
  resetMap();

    //TODO needs ca outline
}


function resetMap(){
  markers.clearLayers();
  myDistricts.clearLayers();
  map.flyToBounds(caBounds);
  document.getElementById('autocomplete').value = '';
  resetDistrictInfo();
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

function LocalOpenStates() {
	this.openStatesURL = "data";
	this.api_key = 'local';
	this.is_local = true;
}

LocalOpenStates.prototype.makeUrl = function(method) {
	return this.openStatesURL + '/' + method + '.json';
}

LocalOpenStates.prototype.callApi = function (url) {
	var xhr = new XMLHttpRequest;
	xhr.open('GET', url, false);
	xhr.send();
	return JSON.parse(xhr.responseText);
}

LocalOpenStates.prototype.getDistricts = function (state, chamber) {
	var method = 'all_districts';
	return this.callApi(this.makeUrl(method));
}

LocalOpenStates.prototype.getDistrictBoundary = function (boundary_id) {
	var method = boundary_id;
	return this.callApi(this.makeUrl(method));
}

function OpenStates(api_key) {
	this.openStatesURL = 'https://openstates.org/api/v1';
	this.api_key = '' + api_key;
	this.is_local = false;
}

function District(json) {
	this.abbr = json.abbr;
	this.boundary_id = json.boundary_id;
	this.chamber = json.chamber;
	this.id = json.id;
	this.legislators = json.legislators;
	this.num_seats = json.num_seats;
	this.boundary = null;
	this.name = json.name;
}

District.prototype.getBoundary = function() {
	if (!this.boundary) {
		var json = null;
		if (!openStates.is_local) {
			json = openStates.getDistrictBoundary(this.boundary_id);
		} else {
			json = openStates.getDistrictBoundary(this.id);
		}
		if (json) {
			this.boundary = this;
			this.bbox = json.bbox;
			this.region = json.region;
			this.shape = json.shape;
		}
	}
	return this.boundary;
}

District.prototype.surroundsPointApprox = function(lat, lon) {
	var boundary = this.getBoundary();
	if (boundary == null) return false;
	var bbox = boundary.bbox;
	return lat >= bbox[0][0] && lon >= bbox[0][1] && lat <= bbox[1][0] && lon <= bbox[1][1];
}

// Ray-casting algorithm ported from C from 
// https://wrf.ecse.rpi.edu//Research/Short_Notes/pnpoly.html
// by W Randolph Franklin
function pointInPolygon(points, lat, lon) {
	var i = 0, j = points.length - 1;
	var c = false;
	for (; i < points.length; j = i++) {
		if (((points[i][1] > lat) != (points[j][1] > lat)) &&
        (lon < (points[j][0] - points[i][0]) * (lat - points[i][1]) / (points[j][1] - points[i][1]) + points[i][0]) ) {
			c = !c;
		}
	}
	return c;
}

District.prototype.surroundsPointExact = function(lat, lon) {
	var boundary = this.getBoundary();
	if (boundary == null) return false;
	var donut = [];
	for (var shape in boundary.shape) {
		donut = boundary.shape[shape];
		if (pointInPolygon(donut[0], lat, lon)) {
			if (donut.length == 2) {
				return !pointInPolygon(donut[1], lat, lon);
			}
			return true;
		}
	}
	return false;
}

function DistrictList(json, state) {
	var district;
	this.upper_districts = [];
	this.lower_districts = [];
	this.state = state;
	this.num_districts = json.length;
	this.districts = {};
	this.district_ids = [];
	for (var i in json) {
		district = new District(json[i]);
		this.districts[district.id] = district;
		this.district_ids.push(district.id);
		var district_num = parseInt(district.name);
		if (district.chamber == 'upper') {
			this.upper_districts[district_num - 1] = district;
		} else if (district.chamber == 'lower') {
			this.lower_districts[district_num - 1] = district;
		}
	}
	this.populated = false;
	this.populator = new DistrictPopulator(this);
}

function DistrictPopulator (districtList) {
	this.districtList = districtList;
	this.currentDistrict = 0;
}

DistrictPopulator.prototype.populate = function () {
	if (this.currentDistrict < this.districtList.num_districts) {
		var district_id = this.districtList.district_ids[this.currentDistrict];
		this.districtList.districts[district_id].getBoundary();
		this.currentDistrict++;
		var that = this;
		var call = function() { that.populate(); };
		setTimeout(call, 10);
	}
}

DistrictList.prototype.getLowerDistrict = function (i) {
	return this.lower_districts[i - 1];
}

DistrictList.prototype.getUpperDistrict = function (i) {
	return this.upper_districts[i - 1];
}

DistrictList.prototype.findNearbyDistricts = function (lat, lon) {
	var nearby = [];
	for (var d in this.districts) {
		var district = this.districts[d];
		if (district.surroundsPointApprox(lat, lon)) {
			nearby.push(district);
		}
	}
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
    districtUpper, districtLower = getDistrictInfo(lat, lng);  //todo make this return


}

function getDistrictInfo(lat, lng){
        // Get the place details from the autocomplete object.

		
	console.log('TODO - GET DISTRICTS') 
	possibleDistricts = stateDistricts.findNearbyDistricts(lat, lng);
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

  var shape = currentDistrict.shape;
  var bbox = currentDistrict.bbox ;

	zoomDistrict(lat, lng, shape, bbox);

  //TODO update to use bounding box for district

  //todo return new district

  return districtUpper, districtLower;
	
 }

 function markerDrag(e){
  console.log('Marker Drag End');
 

  var changedPos = e.target.getLatLng();
  console.log(changedPos);

  var newUpper, newLower = getDistrictInfo(changedPos.lat, changedPos.lng);  

  if( newUpper != districtUpper || newLower != districtLower ) {
    districtUpper = newUpper;
    districtLower = newLower;

    //TODO get new shapes

  }

  //todo get new lat long
  //recalc district
  //re display district -  watch our for circular zoom district - avoid resetting market


 }

 function drawDistricts( shape ){
      myDistricts.clearLayers();
      var boundaryLower = shape[0][0].slice(1).map(function(x) { return [x[1],x[0]]; });

  //TODO random color
  //TODO draw bow
      var polygonLower = L.polygon(boundaryLower, {color: 'red'});
      myDistricts.addLayer( polygonLower );
 }

//TODO deal with upper and lower 
 function zoomDistrict(lat, lng, shape, bbox){
  if(bbox.length == 2) {
    map.flyToBounds(bbox);
  } else {
    map.setView([lat,lng], defaultZoom + 3 );
  }

  var drawNewDistrict = true;
  //TODO detect if district change


  map.on('zoomend', function() {
    if( drawNewDistrict ){

      markers.clearLayers();
      marker = L.marker([lat,lng],{ draggable: true });
      marker.on('dragend', markerDrag);
      markers.addLayer(marker);

  //todo add spiderweb of surrounding districts?
      drawDistricts(shape);

      drawNewDistrict = false;
    }
  });



  //TODO display both districts
  //TODO marker needs drag end event - remap district and rezoom

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
