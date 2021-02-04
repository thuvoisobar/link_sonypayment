var chai = require('chai');
var config = require('../it.config');
var request = require('request-promise');
var chaiSubset = require('chai-subset');
var assert = chai.assert;
var baseUrl = config.baseUrl;
chai.use(chaiSubset);
var cookieJar = request.jar();

describe('CheckoutServices-PlaceOrder', function () {
    describe('When credit card was used', function () {
        this.timeout(20000);

        it('redirects to Cart-Show when basket is empty', function () {
            var updateCheckoutRequest = {
                url: config.baseUrl + '/Cart-Show',
                method: 'GET',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                followRedirect: false,
                simple: false,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            return request(updateCheckoutRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200);
            });
        });

        it('should successfully add credit card method to a basket', function () {
            var myRequest = {
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                url: baseUrl + '/Cart-AddProduct',
                form: {
                    pid: '701643421084M',
                    quantity: 2
                }
            };

            return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200);
            });
        });

        it('should successfully add shipping address to the basket', function () {
            var csrfRequest = {
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };
            var reqData = Object.assign({}, csrfRequest);
            csrfRequest.url = baseUrl + '/CSRF-Generate';
            cookieJar.setCookie(request.cookie(cookieJar.getCookieString(reqData.url), reqData.url));
            return request(csrfRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200);
                var csrfJsonResponse = JSON.parse(response.body);
                var myRequest = {
                    method: 'POST',
                    rejectUnauthorized: false,
                    resolveWithFullResponse: true,
                    jar: cookieJar,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    url: baseUrl + '/CheckoutShippingServices-SubmitShipping',
                    form: {
                        shipmentSelector: 'new',
						dwfrm_shipping_shippingAddress_addressFields_country: 'JP',
						dwfrm_shipping_shippingAddress_addressFields_postalCode: '123-1234',
						dwfrm_shipping_shippingAddress_addressFields_states_stateCode: '神奈川県',
						dwfrm_shipping_shippingAddress_addressFields_city: 'HCM',
						dwfrm_shipping_shippingAddress_addressFields_address1: 'Test',
						dwfrm_shipping_shippingAddress_addressFields_address2: 'Test',
						dwfrm_shipping_shippingAddress_addressFields_lastName: 'Nguyen',
						dwfrm_shipping_shippingAddress_addressFields_firstName: 'Danh',
						dwfrm_shipping_shippingAddress_addressFields_phone: '0112341234',
						dwfrm_shipping_shippingAddress_shippingMethodID: 'JPY001'
                    }
                };
                myRequest.form[csrfJsonResponse.csrf.tokenName] = csrfJsonResponse.csrf.token;
                return request(myRequest);
            })
            .then(function (response) {
                assert.equal(response.statusCode, 200);
            });
        });

        it('should successfully add billing address to the basket', function () {
            var myRequest = {
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                url: baseUrl + '/CheckoutAddressServices-CreateNewAddress',
                form: {
                    shipmentSelector: 'new',
                    dwfrm_billing_billingAddress_addressFields_firstName: 'Danh',
                    dwfrm_billing_billingAddress_addressFields_lastName: 'Nguyen',
                    dwfrm_billing_billingAddress_addressFields_address1: 'Test',
                    dwfrm_billing_billingAddress_addressFields_address2: 'Test',
                    dwfrm_billing_billingAddress_addressFields_country: 'JP',
                    dwfrm_billing_billingAddress_addressFields_states_stateCode: '神奈川県',
                    dwfrm_billing_billingAddress_addressFields_city: 'HCM',
                    dwfrm_billing_billingAddress_addressFields_postalCode: '123-1234',
                    dwfrm_billing_billingAddress_addressFields_phone: '0112341234',
                    dwfrm_billing_shippingAddressUseAsBillingAddress: 'false'
                }
            };

            return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200);
            });
        });

        it('when Order is placed', function () {
            var myRequest = {
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                url: baseUrl + '/CheckoutServices-PlaceOrder',
                form: {
                    Order: {
                        orderNo: '00012501',
                        orderToken: '0d2a8dbd22857791a5df9a7e1f85546b'
                    }
                }
            };

            return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200);
            });
        });
    });
});