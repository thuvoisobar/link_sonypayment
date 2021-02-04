var chai = require('chai');
var config = require('../it.config');
var request = require('request-promise').defaults({ simple: false });
var chaiSubset = require('chai-subset');
var assert = chai.assert;
var baseUrl = config.baseUrl;
chai.use(chaiSubset);
var cookieJar = request.jar();

describe('PaymentInstruments-SavePayment', function () {
    describe('When credit card was used', function () {
        this.timeout(20000);

        it('should successfully add credit card method to a wallet', function () {
            var myRequest = {
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                url: baseUrl + '/PaymentInstruments-SavePayment'
            };


            return request(myRequest)
                .then(function (res) { // eslint-disable-line no-unused-vars
                    var reqData = Object.assign({}, myRequest);
                    myRequest.url = baseUrl + '/CSRF-Generate';
                    cookieJar.setCookie(request.cookie(cookieJar.getCookieString(reqData.url), reqData.url));
                    return request(myRequest);
                })
                // adding payment method
                .then(function (res) {
                    var reqData = Object.assign({}, myRequest);
                    var csrfJsonResponse = JSON.parse(res.body);
                    reqData.url = baseUrl + '/PaymentInstruments-SavePayment';
                    reqData.form = {
						[csrfJsonResponse.csrf.tokenName]: csrfJsonResponse.csrf.token,
                        dwfrm_creditCard_cardType: 'Visa',
                        dwfrm_creditCard_cardOwner: 'Danh',
                        dwfrm_creditCard_cardNumber: '4541********0040',
                        dwfrm_creditCard_expirationMonth: '12',
                        dwfrm_creditCard_expirationYear: '2025',
                        dwfrm_creditCard_token: 'f19d2d51d953519f946017f591a7c15a',
                        dwfrm_creditCard_card: '4541********0040',
                        dwfrm_creditCard_securityCode: '777'
                    };
                    reqData.form[csrfJsonResponse.csrf.tokenName] = csrfJsonResponse.csrf.token;
                    cookieJar.setCookie(request.cookie(cookieJar.getCookieString(reqData.url), reqData.url));
                    return request(reqData);
                })
                .then(function (res) {
                    assert.equal(res.statusCode, 200, 'Expected PaymentInstruments-SavePayment request statusCode to be 200.');
                });
        });
    });
});