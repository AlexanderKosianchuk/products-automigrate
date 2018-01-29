
var request = require('request');
var fs = require('fs');
var cheerio = require('cheerio')
var queryString = require('query-string');

const access = require('./pass');
const products = require('./products');
const tools = require('./tools');

var request = request.defaults({ jar: true })

fs.writeFile('js_log.txt', '', () => {});

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
                fs.appendFileSync('js_log.txt', 'auth reject: '+JSON.stringify(err)+'\r\n');
                reject(err);
            }

            fs.appendFileSync('js_log.txt', 'auth resolve'+'\r\n');

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
                    fs.appendFileSync('js_log.txt', 'dashboard reject: '+JSON.stringify(err)+'\r\n');
                    reject(err);
                } else {
                    fs.appendFileSync('js_log.txt', 'dashboard resolve'+'\r\n');
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
                    fs.appendFileSync('js_log.txt', 'products list reject: '+JSON.stringify(err)+'\r\n');
                    reject(err);
                } else {
                    fs.appendFileSync('js_log.txt', 'products list resolve'+'\r\n');
                    resolve(href);
                }
            }
        );
    });
})
.then((res) => {
    return new Promise((resolve, reject) => {
        /*products.meubel*/
        let indexNum = 0;

        let array = products.meubel;

        let interval = setInterval(() => {
            if (indexNum === array.length) {
              clearInterval(interval);
              return;
            }

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
                                          val.replace(/"([^"]+(?="))"/g, '$1').split(',').forEach((categoriesItem) => {
                                            matches.push(categoriesItem);
                                          });
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

            Promise.all(promiseArray)
              .then((arg) => {
                  parsed.selectedCarriers = ['2', '34', '1'];
                  parsed.submitAddproduct = 1;
                  parsed.submitted_tabs = ['Shipping'];

                  fs.appendFileSync('js_log.txt', 'product update request data'+ queryString.stringify(parsed)+'\r\n');

                  request.post({
                      url: href + '&key_tab=Shipping',
                      form: parsed
                  }, function (err, httpResponse, body) {
                      if (err) {
                        fs.appendFileSync('js_log.txt', 'product update reject. ID'+id+'\r\n');
                        fs.appendFileSync('js_log.txt', 'product update reject: '+JSON.stringify(err)+'\r\n');
                        fs.appendFileSync('js_log.txt', '----------------\r\n\r\n');
                      } else {
                        fs.writeFile('pages/meubel'+id+'.html', body, () => {});
                        fs.appendFileSync('js_log.txt', 'product update complete. ID: '+id+'\r\n');
                        fs.appendFileSync('js_log.txt', '++++++++++++++++\r\n\r\n');
                      }
                  });
              }, (arg) => {
                  fs.appendFileSync('js_log.txt', 'product update reject: '+JSON.stringify(parsed)+'\r\n');
              });
        }, 1000);
    });
});
