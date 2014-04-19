## Getting started

First, clone this repository, then

`cd rtstatforce`
then
`node install`
to install all the dependencies.

## Usage

`node rtstatforce.js`
to execute. The first time executing, it'll ask for your Salesforce.com consumer id, secret, and callback url, and your forecast.io API key. The second time, it'll go through the auth flow, launching a browser and prompting for permission to use your Salesforce account.

After that, executing the command will poll each of your thermostats, and send the readings (along with current weather information) to Salesforce.