
var request = require('request');
var fs = require('fs');

const access = require('./pass');

var options = {
    host: 'http://www.belgameubelen.luch15.com',
    path: '/apanel/index.php?controller=AdminLogin&token=',
};

var request = request.defaults({jar: true})

let promise = new Promise((resolve, reject) => {
    request.post({ url: options.host + options.path + access.token,
        form: {
            email: access.email,
            passwd: access.pass,
            stay_logged_in: 1,
            submitLogin: 1
        }},
        (err, httpResponse, body) => {
            if (err) {
                reject(err);
            }

            fs.writeFile('pages/authPromise.html', body);

            resolve({
                cookie: httpResponse.headers['set-cookie'][0],
                location: httpResponse.headers.location
            });
        }
    );
});

promise.then((res) => {
    return new Promise((resolve, reject) => {
        request.cookie(res.cookie);
        console.log(res.location);
        request.get(options.host + '/apanel/' + res.location,
            (err, httpResponse, body) => {
                if (err) {
                    reject(err);
                } else {
                    fs.writeFile('pages/dashbordPromise.html', body);
                    resolve(body);
                }
            }
        );
    });
})
.then((res) => {
    return new Promise((resolve, reject) => {
        console.log(options.host + '/apanel/index.php?controller=AdminProducts&token='
            + access.token + '&setShopContext=s-7');
        request.get(options.host + '/apanel/index.php?controller=AdminProducts&token='
            + access.token + '&setShopContext=s-7',
            (err, httpResponse, body) => {
                if (err) {
                    reject(err);
                } else {
                    fs.writeFile('pages/productsPromise.html', body);
                    resolve(body);
                }
            }
        );
    });
});
