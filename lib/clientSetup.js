var prompt = require('prompt'),
  LocalStorage = require('node-localstorage').LocalStorage,
  localStorage = new LocalStorage('/Users/matt/.rtstatforce');


var ClientSetup = function() {
// We're simply going to go through and ask the user for all the ids, secrets, keys, etc...
	console.log("It looks like you haven't set up rtstatforce yet. Please refer to the \"Connected App\" you created in Salesforce for the following information.\n");
  prompt.message = "";
  prompt.delimiter = "";
  prompt.colors = false;
  prompt.start();

  prompt.get({
    properties: {
      clientId: {
        description: "Please enter the client Id provided by Salesforce: ",
        required: true,
        message: "Client Id is required."
      },
      clientSecret: {
        description: "Please enter the client secret provided by Salesforce: ",
        required: true,
        message: "Client Secret is required."
      },
      callbackUrl: {
        description: "Please enter the callback Url that you provided to Salesforce: ",
        required: true,
        message: "Callback Url is required."
      },
      forecastAPI: {
        description: "\n\nNow look at the forecast.io developer site.\n\nEnter your forecast.io API key: ",
        required: true,
        message: "Callback Url is required."
      }
    }
  }, function (err, result) {
  	if (!err) {
      localStorage.setItem('clientId',result.clientId);
      localStorage.setItem('clientSecret',result.clientSecret);
      localStorage.setItem('callbackUrl',result.callbackUrl);
      localStorage.setItem('forecastKey',result.forecastAPI);
  	}
  });
}

module.exports = ClientSetup;