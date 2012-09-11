var port = "8124";

var http = require('http');
var url = require('url');

console.log("Started Server");
console.log("Listening on port: " + port);

http.createServer(function (req, res) {
    var path = url.parse(req.url).pathname;
    console.log("request arrived at " + path);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('jsonCallback(\'{"result":{"accounts": [{"id": "Account 1"},{"id": "Account 2"},{"id": "Account 3"},{"id": "Account 4"}],"identity":{"netbankId": "12345678","friendlyName": "Mr John Smith","lastSuccessfulLogin": "2002-09-24"},"proposedTransaction": {"id": "TC1","description": {"cleaned": "Fee (STG ATM)","raw": "Fee (STG ATM)"},"amount": {"currency": "AUD","signed": "2","unsigned": "2","sign": "DR"},"accounts": {"fromAccount": {"id": "Account 1" },"toAccount": {"id": "Account 2" }}}}}\')');
}).listen(port);
