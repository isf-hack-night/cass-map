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
	var i = 0;
	var j = points.length - 1;
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

DistrictList.prototype.getLowerDistrict = function (i) {
	return this.lower_districts[i - 1];
}

DistrictList.prototype.getUpperDistrict = function (i) {
	return this.upper_districts[i - 1];
}

DistrictList.prototype.findNearbyDistricts = function (lat, lon) {
	var nearby = [];
	var district = null;
	for (var d in this.districts) {
		district = this.districts[d];
		if (district.surroundsPointApprox(lat, lon)) {
			nearby.push(district);
		}
	}
	return nearby;
}

DistrictList.prototype.findExactDistrictsInList = function (possibleDistricts, lat, lon) {
	var district = null;
	var upper = null;
	var lower = null;
	for (var d in possibleDistricts) {
		district = possibleDistricts[d];
		if (!lower && district.chamber == 'lower' && district.surroundsPointExact(lat, lon)) {
			lower = possibleDistricts[d];
		} 
		if (!upper && district.chamber == 'upper' && district.surroundsPointExact(lat, lon)) {
			upper = possibleDistricts[d];
		}
	}
	return {upper: upper, lower: lower};
}

DistrictList.prototype.findDistrictsForPoint = function(lat, lon) {
	var nearby = this.findNearbyDistricts(lat, lon);
	console.log(nearby);
	return this.findExactDistrictsInList(nearby, lat, lon);
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
