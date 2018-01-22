
var request = require('request');
var fs = require('fs');
var cheerio = require('cheerio')
var queryString = require('query-string');

const access = require('./pass');
const products = require('./products');
const tools = require('./tools');

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
        let href = access.host + '/apanel/' + $('li#subtab-AdminProducts a').attr('href') + '&setShopContext=s-7';

        request.get(href,
            (err, httpResponse, body) => {
                if (err) {
                    reject(err);
                } else {
                    fs.writeFile('pages/productsPromise.html', body);
                    resolve(href);
                }
            }
        );
    });
})
.then((res) => {
    return new Promise((resolve, reject) => {
        let productsPromiseArray = [];

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        /*products.meubel*/
        let indexNum = 0;

        let array = products.meubel;

        let interval = setInterval(() => {
            let id = array[indexNum];
            console.log(id);
            indexNum++;
            let href = access.host + '/apanel/index.php?'+
                'controller=AdminProducts&id_product='+id+'&updateproduct&token='
                +tools.getParameterByName('token', res);

            let parsed = {};
            let promiseArray = [];

            [
                'Informations',
                'Prices',
                'Seo',
                'Associations',
                'Shipping',
                'Combinations',
                'Quantities',
                'Images',
                'Features',
                'Customization',
                'Attachments',
                'Suppliers'
            ].forEach((tab) => {
                promiseArray.push(new Promise((subResolve, subReject) => {
                        request.get(href + '&key_tab=' + tab,
                            (err, httpResponse, body) => {
                                if (err) {
                                    subReject(err);
                                } else {
                                    let $ = cheerio.load(body);
                                    let form = $('#product_form').serialize();

                                    Object.assign(parsed, queryString.parse(form));

                                    if (tab === 'Associations') {
                                        var matches = [];

                                        body.replace(/var selected_categories = new Array\("(.*?)"\);/, function(a, val, match) {
                                            matches.push(val);
                                        });

                                        parsed.categoryBox = matches;
                                    }

                                    subResolve(body);
                                }
                            }
                        );
                    })
                );
            });

            productsPromiseArray.push(new Promise((productResolve, productReject) => {
                Promise.all(promiseArray)
                    .then((arg) => {
                        parsed.selectedCarriers = ['2', '34', '1'];
                        parsed.submitAddproduct = 1;
                        parsed.submitted_tabs = ['Shipping'];

                        fs.writeFile('pages/parsed.html', queryString.stringify(parsed));

                        request.post({
                            url: href + '&key_tab=Shipping',
                            form: parsed
                        }, function (err, httpResponse, body) {
                            console.log(body);
                            fs.writeFile('pages/meubel'+id+'.html', body);
                        });

                        productResolve(parsed);
                    }, (arg) => {
                        console.log('productReject');
                        productReject(parsed);
                    });
                })
            );

            if (indexNum === array.length - 1) {
                resolve(indexNum);
            }

        }, 1000);
    });
});
