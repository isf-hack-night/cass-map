var map, marker, sldlOverlay, slduOverlay;
var caCenter, defaultZoom, defaultBounds;
var autocomplete, districtUpper, districtLower, zip, state; //todo what about other states
var curOverlay = 'sldl';

//TODO add which state to parameters
var slduPath = "./data/ca-sldu.json";
var sldlPath = "./data/ca-sldl.json";

var layerID = 'my-custom-layer';
var TILE_URL = 'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoid29sZmdhbmctbXB6IiwiYSI6ImNqMnczY2xqYjAwZW8zM255MGlwc2g1NWYifQ.dKJgOK8K1MywiRftFeeomA';

//Mapbox + district layers
//'https://api.mapbox.com/styles/v1/wolfgang-mpz/cj5iov8505bld2rpesj4igei5/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoid29sZmdhbmctbXB6IiwiYSI6ImNqMnczY2xqYjAwZW8zM255MGlwc2g1NWYifQ.dKJgOK8K1MywiRftFeeomA';


//Mapbox light
//'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoid29sZmdhbmctbXB6IiwiYSI6ImNqMnczY2xqYjAwZW8zM255MGlwc2g1NWYifQ.dKJgOK8K1MywiRftFeeomA';


function init() {
	initMap();
	initAutocomplete();
}

function initMap() {
	
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
	
	sldlOverlay = new google.maps.Data();
	slduOverlay = new google.maps.Data();

  sldlOverlay.loadGeoJson(sldlPath);
  slduOverlay.loadGeoJson(slduPath);

  //temp styles
  sldlOverlay.setStyle({
    strokeColor: 'red',
    strokeWeight: 5
   });

  slduOverlay.setStyle({
    strokeColor: 'black',
    strokeWeight: 1
  });
	

  sldlOverlay.setMap(map);
  slduOverlay.setMap(map);
	
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
	
	/*
	var controlDivOverlay = document.createElement('div');
	var overlayControl = new ResetControl(controlDivOverlay, map);
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDivOverlay);
 */
}

function resetMap(){

  if (marker) { marker.setMap(null) }
  map.setCenter(caCenter);
  map.setZoom(defaultZoom);
  document.getElementById('autocomplete').value = '';
  districtUpper, districtLower, zip = '';
  //todo clear mailchimp section
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

  controlUI.addEventListener('click', resetMap());
}

function initAutocomplete() {
        // Create the autocomplete object, restricting the search to geographical
        // location types.
        autocomplete = new google.maps.places.Autocomplete(
            /** @type {!HTMLInputElement} */(document.getElementById('autocomplete')),
            {types: ['geocode']});

        // When the user selects an address from the dropdown, populate the address
        // fields in the form.
        autocomplete.addListener('place_changed', getLatLong);
      }

function getLatLong() {
        // Get the place details from the autocomplete object.
	var place = autocomplete.getPlace();

	var lat = place.geometry.location.lat();
  var lng = place.geometry.location.lng();

  //getstate

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
		
	//TODO map latlng to Districts
	//TODO autopopulate cookie and mailchimp signup fields
	console.log('TODO - GET DISTRICTS')	
	zoomDistrict(place);
	
 }

function zoomDistrict(place){
	
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