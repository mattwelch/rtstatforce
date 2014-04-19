/***************************************
* AutomaticWebhookHandler.cls
* Webhook endpoint for Automatic
***************************************/
/*
*
* THIS IS OBVIOUSLY NOT NODE CODE
* Create a new Apex class in Salesforce, call it RESTThermo.cls, and copy this code in
*
*/
@RestResource(urlMapping='/Thermostat/*')
global class RESTThermo {
    @HttpPost
    global static void postHandler() {
        // Our request. This will contain the POST body, amongst other things
        RestRequest req = RestContext.request;

        // Our response. We'll use this to tell jsforce whether their webhook callout
        // wa successful or not
        RestResponse res = RestContext.response;
        system.debug(req.requestBody.toString());

		RTstatThermo thermoResponse;
        try {
            thermoResponse = RTstatThermo.parse(req.requestBody.toString());
        }
        catch (Exception e) {
        	// Indicate a failure if we couldn't even deserialize the request. Currently, Automatic does
        	// nothing with this failure information
        	res.statusCode = 500;
        	return;
        }

        Thermostat__c t;

        try {
        	t=[select id, UUID__c, name from Thermostat__c where UUID__c=:thermoResponse.tsys.uuid];
        }
        Catch(Exception e) {
        	t=new Thermostat__c(name=thermoResponse.tname.nname, UUID__c=thermoResponse.tsys.uuid);
        	insert t;
        }

        if (t.name != thermoResponse.tname.nname) {
        	t.name = thermoResponse.tname.nname;
        	update t;
        }

        List<String> tMode=new List<String>{'Off','Heat','Cool','Auto'};
        List<String> fMode=new List<String>{'Auto','Auto/Circulate','On'};

        Reading__c r=new Reading__c();
        r.Thermostat__c=t.id;
        r.Temperature__c=thermoResponse.ttstat.temp;
        r.External_Temperature__c=thermoResponse.weather.currently.temperature;
        r.Heat_Set_Point__c=thermoResponse.tttemp.t_heat;
        r.Cool_Set_Point__c=thermoResponse.tttemp.t_cool;
        r.Mode__c=tMode[thermoResponse.ttstat.tmode];
        r.Fan_Mode__c=fMode[thermoResponse.ttstat.fmode];
        r.Current_Mode__c=tMode[thermoResponse.ttstat.tstate];
        r.Fan_On__c=thermoResponse.ttstat.fstate==0?false:true;
        r.External_Conditions__c=thermoResponse.weather.currently.icon;
        r.Hold__c=thermoResponse.ttstat.hold==0?false:true;
        r.Cloud_Cover__c=thermoResponse.weather.currently.cloudCover;

        try {
        	insert r;
        }
        Catch(DmlException e) {
        	res.statusCode=500;
        	return;
        }
        // Tell Automatic that everything went ok.
		res.statusCode = 200;
    }

}