
var request = require('request');
var fs = require('fs');

const email = '';
const pass = '';

var options = {
    host: 'http://www.belgameubelen.luch15.com',
    path: '/apanel/index.php?controller=AdminLogin&token=a9810e5a4510cbca016d79c8d33e1672',
};

var request = request.defaults({jar: true})

let authPromise = new Promise((resolve, reject) => {
    request.post({ url: options.host + options.path,
        form: {
            email: email,
            passwd: pass,
            stay_logged_in: 1,
            submitLogin: 1
        }},
        (err, httpResponse, body) => {
            if (err) {
                reject(err);
            }

            resolve({
                cookie: httpResponse.headers['set-cookie'][0],
                location: httpResponse.headers.location
            });
        }
    );
});

authPromise.then((res) => {
    request.cookie(res.cookie);
    request.get(options.host + '/apanel/' + res.location,
        (err, httpResponse, body) => {
            fs.appendFile('page.html', body);
        }
    );
});
