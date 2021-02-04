/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
'use strict';

/**
* @module controllers/SONY_PAYMENT
*/
var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

/**
 * @description Payment Card Edit
 */
server.get(
    'Edit',
    csrfProtection.generateToken,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var array = require('*/cartridge/scripts/util/array');

        var ccUUID = req.querystring.uuid;

        var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
        var creditCardPaymentInstrument = array.find(paymentInstruments, function (item) {
            return ccUUID === item.UUID;
        });

        var paymentForm = server.forms.getForm('creditCard');
        paymentForm.clear();
        setFormData(paymentForm, creditCardPaymentInstrument);

        res.render('account/payment/addPayment', {
            paymentForm: paymentForm,
            expirationYears: getExpirationYears(),
            UUID: ccUUID,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-Show').toString()
                },
                {
                    htmlValue: Resource.msg('page.heading.payments', 'payment', null),
                    url: URLUtils.url('PaymentInstruments-List').toString()
                }
            ]
        });

        next();
    }
);

/**
 * @param {Object} paymentForm form
 * @param {Object} creditCardPaymentInstrument creditCardPaymentInstrument
 * Update object to payment Form
 */
function setFormData(paymentForm, creditCardPaymentInstrument) {
    var Site = require('dw/system/Site');
    var SonyPaymentHelper = require('*/cartridge/scripts/helpers/sonyPaymentHelper');

    var errorMessage;
    var token = creditCardPaymentInstrument.raw.creditCardToken;
    var memberInfo = SonyPaymentHelper.viewMember(token, creditCardPaymentInstrument.UUID, errorMessage);

    var ccNumber = memberInfo.CardNo;
    var expMonth = Number(memberInfo.CardExp.substr(2, 4));
    // eslint-disable-next-line radix
    var expYear = parseInt('20' + memberInfo.CardExp.substr(0, 2));

    var months = paymentForm.expirationMonth.options;
    for (var j = 0, k = months.length; j < k; j++) {
        if (months[j].value === expMonth) {
            months[j].selected = true;
        } else {
            months[j].selected = false;
        }
    }

    paymentForm.cardOwner.value = creditCardPaymentInstrument.creditCardHolder;
    paymentForm.cardType.value = creditCardPaymentInstrument.creditCardType;
    paymentForm.cardNumber.value = ccNumber;
    paymentForm.expirationYear.value = expYear;
    paymentForm.expirationMonth.value = expMonth;

    if (Site.getCurrent().getCustomPreferenceValue('sony_enable_card_attributes')) {
        paymentForm.ccphone.value = creditCardPaymentInstrument.raw.custom.hasOwnProperty('creditCardPhone') ? creditCardPaymentInstrument.raw.custom.creditCardPhone : '';
        paymentForm.lastnameKana.value = creditCardPaymentInstrument.raw.custom.hasOwnProperty('creditCardLastKanaName') ? creditCardPaymentInstrument.raw.custom.creditCardLastKanaName : '';
        paymentForm.firstnameKana.value = creditCardPaymentInstrument.raw.custom.hasOwnProperty('creditCardKanaName') ? creditCardPaymentInstrument.raw.custom.creditCardKanaName : '';

        var days = paymentForm.birthdayDay.options;
        var creditCardBirthdayDay = creditCardPaymentInstrument.raw.custom.hasOwnProperty('creditCardBirthdayDay') ? creditCardPaymentInstrument.raw.custom.creditCardBirthdayDay : '01';
        // eslint-disable-next-line no-redeclare
        for (var j = 0, k = days.length; j < k; j++) {
            if (days[j].value === creditCardBirthdayDay) {
                days[j].selected = true;
                break;
            }
        }
        months = paymentForm.birthdayMonth.options;
        var creditCardBirthdayMonth = creditCardPaymentInstrument.raw.custom.hasOwnProperty('creditCardBirthdayMonth') ? creditCardPaymentInstrument.raw.custom.creditCardBirthdayMonth : '01';
        // eslint-disable-next-line no-redeclare
        for (var j = 0, k = months.length; j < k; j++) {
            if (months[j].value === creditCardBirthdayMonth) {
                months[j].selected = true;
                break;
            }
        }
    }
    return;
}

/**
 * Creates a list of expiration years from the current year
 * @returns {List} a plain list of expiration years from current year
 */
function getExpirationYears() {
    var currentYear = new Date().getFullYear();
    var creditCardExpirationYears = [];

    for (var i = 0; i < 10; i++) {
        creditCardExpirationYears.push((currentYear + i).toString());
    }

    return creditCardExpirationYears;
}

/**
 * @description Redirect to 3D Secure
 */
server.get(
    'RedirectTo3dsecure',
    csrfProtection.generateToken,
    server.middleware.https,
    function (req, res, next) {
        var Site = require('dw/system/Site');
        var merchantId = req.querystring.merchantId;
        var encValue = null;

        if (req.session.privacyCache.get('sonyPaymentEncValue')) {
            encValue = req.session.privacyCache.get('sonyPaymentEncValue');
            req.session.privacyCache.set('sonyPaymentEncValue', null);
        }

        var threedsecure = Site.getCurrent().getCustomPreferenceValue('3dSecureURL');

        res.render('account/payment/3dsecure', {
            EncValue: encValue,
            MerchantID: merchantId,
            Threedsecure: threedsecure
        });

        next();
    }
);

/**
 * @description Lock Payment Card
 */
server.get('Lock', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var array = require('*/cartridge/scripts/util/array');
    var Resource = require('dw/web/Resource');
    var UUID = req.querystring.UUID;
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var payment = array.find(paymentInstruments, function (item) {
        return UUID === item.UUID;
    });

    var SonyPaymentHelper = require('*/cartridge/scripts/helpers/sonyPaymentHelper');

    if (SonyPaymentHelper.invalidMember(payment.raw.creditCardToken, UUID)) {
        res.json({
            success: true,
            message: Resource.msg('account.paymentinstrumentlist.lockSuccess', 'account_ja_JP', null)
        });
    } else {
        res.json({
            success: false,
            message: Resource.msg('account.paymentinstrumentlist.lockFailed', 'account_ja_JP', null)
        });
    }

    return next();
});

/**
 * @description Unlock Payment Card
 */
server.get('Unlock', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var array = require('*/cartridge/scripts/util/array');
    var Resource = require('dw/web/Resource');
    var UUID = req.querystring.UUID;
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var payment = array.find(paymentInstruments, function (item) {
        return UUID === item.UUID;
    });

    var SonyPaymentHelper = require('*/cartridge/scripts/helpers/sonyPaymentHelper');

    if (SonyPaymentHelper.cancelInvalidMember(payment.raw.creditCardToken, UUID)) {
        res.json({
            success: true,
            message: Resource.msg('account.paymentinstrumentlist.unlockSuccess', 'account_ja_JP', null)
        });
    } else {
        res.json({
            success: false,
            message: Resource.msg('account.paymentinstrumentlist.unlockFailed', 'account_ja_JP', null)
        });
    }
    return next();
});

/**
 * @description Listener 3D secure return when manage card
 */
server.post(
    'ListenerSonyManageCard',
    csrfProtection.generateToken,
    server.middleware.https,
    // eslint-disable-next-line consistent-return
    function (req, res, next) {
        var AESHelper = require('*/cartridge/scripts/helpers/AESHelper');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var array = require('*/cartridge/scripts/util/array');
        var URLUtils = require('dw/web/URLUtils');
        var Transaction = require('dw/system/Transaction');

        var params = request.httpParameterMap;
        var enCryptValue = params.EncryptValue.stringValue;

        var decodedValue = AESHelper.decode(enCryptValue);
        var verifyData = convertParamsToObject(decodedValue);

        var ccUUID = null;
        if (req.session.privacyCache.get('ccUUID')) {
            ccUUID = req.session.privacyCache.get('ccUUID');
            req.session.privacyCache.set('ccUUID', null);
        } else {
            res.redirect(URLUtils.url('PaymentInstruments-List'));
            return next();
        }

        var paymentForm = server.forms.getForm('creditCard');
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var wallet = customer.getProfile().getWallet();

        var paymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
        var creditCardPaymentInstrument = array.find(paymentInstruments, function (item) {
            return ccUUID === item.UUID;
        });

        var UUID = req.session.privacyCache.get('editPaymentId') ? req.session.privacyCache.get('editPaymentId') : null;
        if (verifyData.ResponseCd === 'OK') {
            if (UUID) {
                req.session.privacyCache.set('editPaymentId', null);
                paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
                creditCardPaymentInstrument = array.find(paymentInstruments, function (item) {
                    return UUID === item.UUID;
                });
                Transaction.wrap(function () {
                    wallet.removePaymentInstrument(creditCardPaymentInstrument.raw);
                });
            }
            res.redirect(URLUtils.url('PaymentInstruments-List'));
        } else {
            var SonyPaymentHelper = require('*/cartridge/scripts/helpers/sonyPaymentHelper');
            var sonyErrorMessage = SonyPaymentHelper.getErrorMessage(decodeURIComponent(verifyData.ResponseCd));

            Transaction.wrap(function () {
                wallet.removePaymentInstrument(creditCardPaymentInstrument);
            });

            var Resource = require('dw/web/Resource');

            res.render('account/payment/addPayment', {
                paymentForm: paymentForm,
                expirationYears: getExpirationYears(),
                SonyErrorMessage: sonyErrorMessage,
                UUID: UUID,
                breadcrumbs: [
                    {
                        htmlValue: Resource.msg('global.home', 'common', null),
                        url: URLUtils.home().toString()
                    },
                    {
                        htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                        url: URLUtils.url('Account-Show').toString()
                    },
                    {
                        htmlValue: Resource.msg('page.heading.payments', 'payment', null),
                        url: URLUtils.url('PaymentInstruments-List').toString()
                    }
                ]
            });
        }
        next();
    }
);

/**
 * Convert form encoded parameter to object
 *
 * @param {string} params encoded parameter string
 * @returns {Object} output object
 */
function convertParamsToObject(params) {
    var paramArr = params.split('&');
    var returnObj = {};
    for (var i in paramArr) {
        var split = paramArr[i].split('=');
        returnObj[split[0]] = split[1] + (split[2] ? ('=' + split[2]) : '');
    }
    return returnObj;
}


/**
 * @description Get Payment Information
 * @param {String} UUID
 */
server.get('SelectCreditCard', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var data = res.getViewData();
    if (data && !data.loggedin) {
        res.json();
        return next();
    }

    var array = require('*/cartridge/scripts/util/array');
    var Resource = require('dw/web/Resource');
    var UUID = req.querystring.UUID;
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var payment = array.find(paymentInstruments, function (item) {
        return UUID === item.UUID;
    });

    if (payment) {
        res.json({
            success: true,
            maskedNumber: payment.creditCardNumber,
            expirationMonth: payment.creditCardExpirationMonth.toString(),
            expirationYear: payment.creditCardExpirationYear.toString(),
            memberToken: payment.raw.creditCardToken,
            creditCardBirthdayDay: payment.raw.custom.hasOwnProperty('creditCardBirthdayDay') ? payment.raw.custom.creditCardBirthdayDay : '01',
            creditCardBirthdayMonth: payment.raw.custom.hasOwnProperty('creditCardBirthdayMonth') ? payment.raw.custom.creditCardBirthdayMonth : '01',
            creditCardPhone: payment.raw.custom.hasOwnProperty('creditCardPhone') ? payment.raw.custom.creditCardPhone : '',
            creditCardLastKanaName: payment.raw.custom.hasOwnProperty('creditCardLastKanaName') ? payment.raw.custom.creditCardLastKanaName : '',
            creditCardKanaName: payment.raw.custom.hasOwnProperty('creditCardKanaName') ? payment.raw.custom.creditCardKanaName : ''
        });
    } else {
        res.json({
            success: false,
            message: Resource.msg('account.paymentinstrumentlist.unlockFailed', 'account_ja_JP', null)
        });
    }

    return next();
});

/**
 * @param {string} currentOrderNo Numer
 * @param {Object} verifyData Data
 * @param {boolean} isFailed3D Failed 3D Secure
 * @param {boolean} req request
 * @returns {string} Fail Order when 3D Secure Error and Back to Billing Page
 */
function failOrder3dSecure(currentOrderNo, verifyData, isFailed3D, req) {
    var SonyPaymentHelper = require('*/cartridge/scripts/helpers/sonyPaymentHelper');

    SonyPaymentHelper.failOrder(currentOrderNo, verifyData);
    server.forms.getForm('creditCard').clear();
    var sonyErrorMessage = isFailed3D ? Resource.msg('error.msg.secure.' + verifyData.SecureResultCode, 'checkout', null) : SonyPaymentHelper.getErrorMessage(decodeURIComponent(verifyData.ResponseCd));
    req.session.privacyCache.set('sonySecureErrorMessage', sonyErrorMessage);
    return sonyErrorMessage;
}


server.post('ListenerSony', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var AESHelper = require('*/cartridge/scripts/helpers/AESHelper');
    var SonyPaymentHelper = require('*/cartridge/scripts/helpers/sonyPaymentHelper');
    var Transaction = require('dw/system/Transaction');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
    var URLUtils = require('dw/web/URLUtils');
    var BasketMgr = require('dw/order/BasketMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var params = request.httpParameterMap;
    var enCryptValue = params.EncryptValue.stringValue;
    var order = OrderMgr.getOrder(req.session.privacyCache.get('currentOrderNo'));
    var decodedValue = AESHelper.decode(enCryptValue);
    var verifyData = convertParamsToObject(decodedValue);

    if (verifyData.ApproveNo && verifyData.ResponseCd === 'OK') {
        SonyPaymentHelper.finalizeOrder(req.session.privacyCache.get('currentOrderNo'), verifyData, req);
        var paymentForm = server.forms.getForm('creditCard');
        paymentForm.clear();

        var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
        if (fraudDetectionStatus.status === 'fail') {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

            // fraud detection failed
            req.session.privacyCache.set('fraudDetectionStatus', true);

            res.json({
                error: true,
                cartError: true,
                redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });

            return next();
        }

        // Places the order
        var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
        if (placeOrderResult.error) {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }

        if (req.currentCustomer.addressBook) {
            // save all used shipping addresses to address book of the logged in customer
            var allAddresses = addressHelpers.gatherShippingAddresses(order);
            allAddresses.forEach(function (address) {
                if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                    addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
                }
            });
        }

        if (order.getCustomerEmail()) {
            COHelpers.sendConfirmationEmail(order, req.locale.id);
        }

        // Reset usingMultiShip after successful Order placement
        req.session.privacyCache.set('usingMultiShipping', false);
        req.session.privacyCache.set('ccUUID', null);


        var continueUrl = URLUtils.url('Order-Confirm').toString();
        var urlParams = {
            ID: order.orderNo,
            token: order.orderToken
        };

        continueUrl += (continueUrl.indexOf('?') !== -1 ? '&' : '?') +
            Object.keys(urlParams).map(function (key) {
                return key + '=' + encodeURIComponent(urlParams[key]);
            }).join('&');

        res.redirect(continueUrl);
    } else {
        var array = require('*/cartridge/scripts/util/array');
        var UUID = req.session.privacyCache.get('ccUUID');
        if (UUID) {
            req.session.privacyCache.set('ccUUID', null);
            var wallet = customer.getProfile().getWallet();
            var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
            var creditCardPaymentInstrument = array.find(paymentInstruments, function (item) {
                return UUID === item.UUID;
            });
            if (creditCardPaymentInstrument) {
                Transaction.wrap(function () {
                    wallet.removePaymentInstrument(creditCardPaymentInstrument.raw);
                });
            }
        }

        failOrder3dSecure(req.session.privacyCache.get('currentOrderNo'), verifyData, false, req);
        res.redirect(URLUtils.url('Checkout-Begin') + '?stage=placeOrder#placeOrder');
    }

    return next();
});
module.exports = server.exports();
