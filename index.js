var http = require('http');
var fs = require('fs');

var options = {
    host: 'www.belgameubelen.luch15.com',
    path: '/apanel/index.php?controller=AdminLogin&token=a9810e5a4510cbca016d79c8d33e1672',
    method: 'POST'
};

callback = function(response) {
  var str = '';

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
      fs.appendFile("page.html", chunk, function(err) {
        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
      //console.log(str);
  });
}

var req = http.request(options, callback)

req.write('data\n');

req.on('error', function (error) {
    console.log(error);
})

req.end();
