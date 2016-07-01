var http = require("http");
var logHelper = require("../logHelper.js");
var Log = logHelper.Log;
logHelper.init();

http.createServer(function(request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});  
    response.write("Hello World");  
    response.end();
}).listen(8899);

console.log("nodejs start listen 8899 port!!!!!!!!!!!!");
Log.i(null, "nodejs start listen 8899 port");
console.log("nodejs start listen 8899 port!!!!!!!!!!!!");