var jsfOAuth = require("./lib/jsfOAuth"),
	clientSetup = require("./lib/clientSetup"),
	Q = require("q"),
	LocalStorage = require('node-localstorage').LocalStorage,
	localStorage = new LocalStorage('/Users/matt/.rtstatforce'),
	weatherman = require( 'weatherman.io' ),
	jsforce = require("jsforce"),
    stat = require('rtstat');

// If our various api keys aren't set, we need to prompt the user to enter them. Bring up a "clientSetup". Due to asynchronous
// nature of node, we return after the call so we don't go on. THis means that the script stops after the user enters
// the info. User has to restart to move to next step
if (localStorage.getItem('clientId')==null || localStorage.getItem('clientSecret')==null || localStorage.getItem('callbackUrl')==null || localStorage.getItem('forecastKey')==null) {
	clientSetup();
	return;
}

// If our OAuth tokens aren't set, we have to perform the OAuth flow. Same as above. Flow stops after OAuth is complete.
if (localStorage.getItem('accessToken')==null || localStorage.getItem('refreshToken')==null || localStorage.getItem('instanceUrl')==null) {
	jsfOAuth();
	return;
}


var setupPromises=[];

// Find our local thermostats
var tstats=stat.findThermostats();
setupPromises.push(tstats);

// Let's get the current weather
var weather = weatherman( localStorage.getItem("forecastKey") );
weather.options={
	exclude:["minutely", "hourly", "daily", "alerts", "flags"]
};
weather.goOnLocation(35.954925,-79.018435);

// We'll make the weather callout, and turn it in to a promise, so we can act on both
// the tstat discover and weather at the same time
var deferred = Q.defer();
weather.doForecast(function(err,data) {
	if (err) {
		deferred.reject(new Error(err));
	}
	deferred.resolve(data);
});
var weatherPromise=deferred.promise;
setupPromises.push(weatherPromise);

// Let's connect to SFDC using the tokens we got from the flow
var conn = new jsforce.Connection({
  oauth2 : {
    clientId : localStorage.getItem("clientId"),
    clientSecret : localStorage.getItem("clientSecret"),
    redirectUri : localStorage.getItem("callbackUrl")
  },
  instanceUrl : localStorage.getItem("instanceUrl"),
  accessToken : localStorage.getItem("accessToken"),
  refreshToken : localStorage.getItem("refreshToken")
});
// and if we had to refresh, let's save the new access token
conn.on("refresh", function(accessToken, res) {
	localStorage.setItem("accessToken",accessToken)
});

// Grab all our returned promises and act on them...
Q.all(setupPromises).then(function(setupData) {
// Our thermostats are first... let's loop through them
	var thermostats=setupData[0];
	for (var key in thermostats) {
		// Now we'll queue up all our calls to our thermostat...
		var promiseArray=[];
    	var dsys=thermostats[key].sys();
    	promiseArray.push(dsys)
    	var dname=thermostats[key].name();
    	promiseArray.push(dname)
    	var dtstat=thermostats[key].tstat();
    	promiseArray.push(dtstat)
    	var dttemp=thermostats[key].ttemp();
    	promiseArray.push(dttemp);

// Once their all done, send them, along with our weather, to be POSTed to SFDC
		Q.all(promiseArray).then(function(data) {
    		saveThermoData(data, setupData[1]);
		},
		function(err) {
			console.log(err);
		})
	}
},
function(err) {
	console.log(err);
});


function saveThermoData(data, weatherData) {
	var tsys=data[0];
	var tname=data[1];
// "name" is reserved, so we make a new key called "nname". The name key will be
// ignored during deserialization
	tname.nname=tname.name;
	var ttstat=data[2];
// Same with override: reserved
	ttstat.ooverride=ttstat.override;
	var tttemp=data[3];

// Make a big ole object to send up
	var postData={tsys: tsys, tname: tname, ttstat: ttstat, tttemp: tttemp, weather: weatherData};

// And POST to our Apex REST endpoint
	conn.apex.post("/Thermostat/", postData, function(err, res) {
	  if (err) { return console.error(err); }
	});

}