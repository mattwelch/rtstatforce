var jsforce = require("jsforce"),
	open = require('open'),
	http = require('http'),
	url = require('url'),
	LocalStorage = require('node-localstorage').LocalStorage,
	localStorage = new LocalStorage('/Users/matt/.rtstatforce');

var oauth2 = new jsforce.OAuth2({
  clientId : localStorage.getItem("clientId"),
  clientSecret : localStorage.getItem("clientSecret"),
  redirectUri : localStorage.getItem("callbackUrl")
});

var OAuth=function() {
	console.log("It looks like you haven't finished setting up rtstatforce yet. We're going to perform the OAuth flow now. You will be redirected via your browser to\nSalesforce. Log in to your org, and authorize rtstatforce.\n\n");

// Open up the user's browser and send them to the auth page for their SF instance (jsforce nicely provides this URL for us)
	open(oauth2.getAuthorizationUrl({ scope : 'api id visualforce refresh_token' }));

// At the same time, set up a server to get the callback from SFDC....
	var oAuthServer=http.createServer(function (req, res) {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end("");

// Grab the query string....
		var url_parts = url.parse(req.url, true);
		var query = url_parts.query;
// Now turn around and call back out to SFDC with our temporary token....
		var conn = new jsforce.Connection({ oauth2 : oauth2 });
		conn.authorize(query.code, function(err, userInfo) {
			if (err) { return console.error(err); }
// And save the results so we can easily log in in the future
			localStorage.setItem('accessToken', conn.accessToken);
			localStorage.setItem('refreshToken', conn.refreshToken);
			localStorage.setItem('instanceUrl', conn.instanceUrl);
			console.log("IAuthorization complete. rtstatforce is ready to use\n");
		});
		oAuthServer.close();
		req.connection.end();
		req.connection.destroy();
	}).listen(8085, "127.0.0.1");
}

module.exports = OAuth;