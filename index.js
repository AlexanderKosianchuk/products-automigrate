
var request = require('request');
var fs = require('fs');
var cheerio = require('cheerio')

const access = require('./pass');

var request = request.defaults({ jar: true })

let promise = new Promise((resolve, reject) => {
    request.post({ url: access.host+access.path+access.token,
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

        request.get(access.host + '/apanel/' + res.location,
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
        let $ = cheerio.load(res);
        let href = '/apanel/' + $('li#subtab-AdminProducts a').attr('href') + '&setShopContext=s-7';

        request.get(access.host + href,
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
