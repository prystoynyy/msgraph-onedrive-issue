const http = require('https');
const querystring = require('querystring');

var needIteration = 2000;
var clientId = "clientId" // ClientId of App
var resource = "https://graph.microsoft.com/"
var clientSecret = "clientSecret" // ClientSecret of App
var tenantId = "tenantId" // TenantId
var graphGroupId = "graphGroupId" // Graph group id
var folderPath = "folder path" // path to folder where need create test folders // "MyFolder/Tests"

getJWTToken((token) => {
    testCreationFolderByGraph(token);
})

var timeResponce = [];

var errorCount = 0;


function getJWTToken(cb) {
    var postParams = {
        "client_id": clientId,
        "resource": resource,
        "client_secret": clientSecret,
        "grant_type": "client_credentials"
    }
    var data = querystring.stringify(postParams);
    var options = {
        hostname: "login.microsoftonline.com",
        port: 443,
        path: "/" + tenantId + "/oauth2/token",
        method: 'POST',
        headers: {
            'Content-Type': "application/x-www-form-urlencoded",
            'Content-Length': data.length
        }
    };

    var request = http.request(options, (res) => {
        console.log("statusCode: ", res.statusCode);
        let body = "";
        res.on("data", data => {
            body += data;
        });
        res.on("end", (dd) => {
            try {
                if (body) {
                    body = JSON.parse(body);
                    var token = body.token_type + " " + body.access_token;
                    console.log("Token: " + token)
                    cb(body.token_type + " " + body.access_token);
                }
            } catch (e) {
                console.log(e);
                console.log(body);
            }
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

    request.write(data);
    request.end();
}



function testCreationFolderByGraph(token) {
    needIteration--;
    if (needIteration <= 0) {
        var alltime = 0;
        for (var i = 0; i < timeResponce.length; i++) {
            alltime += timeResponce[i];
        }
        console.log("Avarange time:");
        console.log(alltime / timeResponce.length);
        console.log("Error count: " + errorCount);
        return;
    }
    console.log(">>> need iterations: " + needIteration)

    console.log("Start request");
    var d = new Date().getTime();
    createFolderByGraph(new Date().getTime(), token, () => {
        var finished = (new Date().getTime() - d);
        timeResponce.push(finished);
        console.log("Finished in: " + (new Date().getTime() - d) + " ms.");
        console.log();
        testCreationFolderByGraph(token);
        testCreationFolderByGraph(token);
    })
}

function createFolderByGraph(folderName, token, cb) {
    var data = {
        name: folderName + "",
        "folder": {}
    }
    data = JSON.stringify(data);

    var options = {
        hostname: "graph.microsoft.com",
        port: 443,
        path: "/v1.0/groups/"+graphGroupId+"/drive/root:/"+folderPath+":/children",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
            'Content-Length': Buffer.byteLength(data)
        }
    };

    var request = http.request(options, (res) => {
        if (res.statusCode == 504) {
            errorCount++;
            console.warn("statusCode: ", res.statusCode);
        } else {
            console.log("statusCode: ", res.statusCode);
        }
        let body = "";
        res.on("data", data => {
            body += data;
        });
        res.on("end", (dd) => {
            try {
                if (body) {
                    body = JSON.parse(body);
                }
            } catch (e) {
                console.log(e);
                console.log(body);
                errorCount++;
            }
            cb();
        });
    }).on("error", (err) => {
        errorCount++;
        console.log("Error: " + err.message);
    });

    console.log("Creation folder...");

    request.write(data);
    request.end();
}