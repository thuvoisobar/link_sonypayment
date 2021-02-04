/* eslint-disable no-redeclare */
'use strict';

var collections = require('*/cartridge/scripts/util/collections');

var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var Encoding = require('dw/crypto/Encoding');
var Logger = require('dw/system/Logger');
var StringUtils = require('dw/util/StringUtils');
var System = require('dw/system/System');
var AESHelper = require('*/cartridge/scripts/helpers/AESHelper');
var URLUtils = require('dw/web/URLUtils');
var SonyPaymentHelper = require('*/cartridge/scripts/helpers/sonyPaymentHelper');


/**
 * Get credit card token
 * @returns {string} a token
 */
function createToken() {
    var server = require('server');
    var paymentForm;
    paymentForm = server.forms.getForm('billing');
    if (paymentForm.creditCardFields.token.value) {
        return paymentForm.creditCardFields.token.value;
    }
    paymentForm = server.forms.getForm('creditCard');
    return paymentForm.token.value;
}

/**
 * Get order token
 * @returns {string} a token
 */
function getOrderToken() {
    var server = require('server');
    var paymentForm = server.forms.getForm('billing');
    return paymentForm.creditCardFields.ordertoken.value;
}

/**
 * @description sonyHashDatad
 * @param {Object} data data
 * @param {string} key key
 * @returns {string} string
 */
function sonyHashData(data, key) {
    var result = null;
    try {
        var hmac = new dw.crypto.Mac(dw.crypto.Mac.HMAC_MD5);
        var mvalue = hmac.digest(data, key);
        result = Encoding.toHex(mvalue);
    } catch (e) {
        Logger.getLogger('paymentOperator').error('Function SonyHashData throws exception! {0}', e);
    }
    return result.substr(0, 11);
}

/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @param {string} paymentMethodID - paymentmethodID
 * @param {Object} req the request object
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation, paymentMethodID, req) {
    var currentBasket = basket;
    var cardErrors = {};
    var cardNumber = paymentInformation.cardNumber.value;
    var cardSecurityCode = paymentInformation.securityCode.value;
    var expirationMonth = paymentInformation.expirationMonth.value;
    var expirationYear = paymentInformation.expirationYear.value;
    var serverErrors = [];
    var creditCardStatus;


    var cardType = paymentInformation.cardType.value;
    var paymentCard = PaymentMgr.getPaymentCard(cardType);


    // Validate payment instrument
    if (paymentMethodID === PaymentInstrument.METHOD_CREDIT_CARD) {
        var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
        var paymentCardValue = PaymentMgr.getPaymentCard(paymentInformation.cardType.value);

        var applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
            req.currentCustomer.raw,
            req.geolocation.countryCode,
            null
        );

        if (!applicablePaymentCards.contains(paymentCardValue)) {
            // Invalid Payment Instrument
            var invalidPaymentMethod = Resource.msg('error.payment.not.valid', 'checkout', null);
            return { fieldErrors: [], serverErrors: [invalidPaymentMethod], error: true };
        }
    }

    if (!paymentInformation.creditCardToken) {
        if (paymentCard) {
            creditCardStatus = paymentCard.verify(
                expirationMonth,
                expirationYear,
                cardNumber,
                cardSecurityCode
            );
            if (isNaN(cardSecurityCode)) {
                creditCardStatus = dw.system.Status(1, 'CREDITCARD_INVALID_SECURITY_CODE');
            }
        } else {
            cardErrors[paymentInformation.cardNumber.htmlName] =
                Resource.msg('error.invalid.card.number', 'creditCard', null);

            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }

        if (creditCardStatus.error) {
            collections.forEach(creditCardStatus.items, function (item) {
                switch (item.code) {
                    case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                        cardErrors[paymentInformation.cardNumber.htmlName] =
                            Resource.msg('error.invalid.card.number', 'creditCard', null);
                        break;

                    case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                        cardErrors[paymentInformation.expirationMonth.htmlName] =
                            Resource.msg('error.expired.credit.card', 'creditCard', null);
                        cardErrors[paymentInformation.expirationYear.htmlName] =
                            Resource.msg('error.expired.credit.card', 'creditCard', null);
                        break;

                    case PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                        cardErrors[paymentInformation.securityCode.htmlName] =
                            Resource.msg('error.invalid.security.code', 'creditCard', null);
                        break;
                    default:
                        serverErrors.push(
                            Resource.msg('error.card.information.error', 'creditCard', null)
                        );
                }
            });

            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }
    }


    if (SonyPaymentHelper.validationDate(paymentInformation)) {
        Transaction.wrap(function () {
            var paymentInstruments = currentBasket.getPaymentInstruments(
                PaymentInstrument.METHOD_CREDIT_CARD
            );

            collections.forEach(paymentInstruments, function (item) {
                currentBasket.removePaymentInstrument(item);
            });

            var paymentInstrument = currentBasket.createPaymentInstrument(
                PaymentInstrument.METHOD_CREDIT_CARD, currentBasket.totalGrossPrice
            );

            paymentInformation.creditCardToken = paymentInformation.creditCardToken ? paymentInformation.creditCardToken : createToken();

            paymentInstrument.setCreditCardHolder(currentBasket.billingAddress.fullName);
            paymentInstrument.setCreditCardNumber(cardNumber);
            paymentInstrument.setCreditCardType(cardType);
            paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
            paymentInstrument.setCreditCardExpirationYear(expirationYear);
            paymentInstrument.setCreditCardToken(paymentInformation.creditCardToken);
            paymentInstrument.custom.sonyPayType = '01';
        });
    } else {
        cardErrors[paymentInformation.birthdayDay.htmlName] =
                            Resource.msg('creditcard.birthday.dayvalueerror', 'form', null);

        return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
    }


    return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @param {Object} req -  Request
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor, req) {
    var OrderMgr = require('dw/order/OrderMgr');
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;

    // SONY PAYMENT

    req.session.privacyCache.set('currentOrderNo', orderNumber);
    var amount = paymentInstrument.paymentTransaction.amount;
    var ordertoken = getOrderToken();
    var order = OrderMgr.getOrder(orderNumber);

    try {
        if (!Site.getCurrent().getCustomPreferenceValue('sony_authorization_mode_only')) {
            if (Site.getCurrent().getCustomPreferenceValue('sony_enable_3dsecure') === true) {
                var enRedirectUrl = Site.getCurrent().getCustomPreferenceValue('3dSecureRedirectURL');
                var enPostUrl = Site.getCurrent().getCustomPreferenceValue('3dSecurePostURL');
                var merchantFree1 = !empty(Site.getCurrent().getCustomPreferenceValue('sony_merchantFree')) ? Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') : '';
                var merchantFree2 = !empty(Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) ? Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') : '';

                var params = [
                    'MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW'),
                    'TransactionDate=' + StringUtils.formatCalendar(System.getCalendar(), 'yyyyMMdd'),
                    'OperateId=1Gathering',
                    'MerchantFree1=' + merchantFree1,
                    'MerchantFree2=' + merchantFree2,
                    'MerchantFree3=' + orderNumber,
                    'ProcNo=' + SonyPaymentHelper.getProcNo(),
                    'TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode'),
                    'PayType=01',
                    'Amount=' + Math.round(amount),
                    'RedirectUrl=' + enRedirectUrl,
                    'PostUrl=' + enPostUrl
                ];

                if (req.session.privacyCache.get('sonySelectedCard')) {
                    var uuid = req.session.privacyCache.get('sonySelectedCard');
                    var kaiinId = uuid.substr(0, 11);
                    var kaiinPass = sonyHashData(kaiinId, customer.ID);
                    params.push('KaiinId=' + kaiinId);
                    params.push('KaiinPass=' + kaiinPass);
                } else {
                    params.push('Token=' + ordertoken);
                }
                var stringToEncrypt = params.join('&');

                var encValue = AESHelper.encode(stringToEncrypt);
                var merchantId = Site.getCurrent().getCustomPreferenceValue('sony_merchantID');

                req.session.privacyCache.set('sonyPaymentEncValue', encValue);

                return {
                    error: false,
                    waitResult: true,
                    redirectUrl: URLUtils.url('SonyPayment-RedirectTo3dsecure').toString() + '?merchantId=' + merchantId
                };
            } else if (SonyPaymentHelper.masterGathering(order, amount, ordertoken, req)) {
                Transaction.wrap(function () {
                    paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
                });
            } else {
                error = true;
                if (req.session.privacyCache.get('sonyPaymentErrorMessage')) {
                    serverErrors.push(req.session.privacyCache.get('sonyPaymentErrorMessage'));
                    req.session.privacyCache.set('sonyPaymentErrorMessage', null);
                } else {
                    serverErrors.push(Resource.msg('error.technical', 'checkout', null));
                }
            }
        } else if (Site.getCurrent().getCustomPreferenceValue('sony_enable_3dsecure') === true) {
            var enRedirectUrl = Site.getCurrent().getCustomPreferenceValue('3dSecureRedirectURL');
            var enPostUrl = Site.getCurrent().getCustomPreferenceValue('3dSecurePostURL');
            var merchantFree1 = !empty(Site.getCurrent().getCustomPreferenceValue('sony_merchantFree')) ? Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') : '';
            var merchantFree2 = !empty(Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) ? Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') : '';

            var params = [
                'MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW'),
                'TransactionDate=' + StringUtils.formatCalendar(System.getCalendar(), 'yyyyMMdd'),
                'OperateId=1Auth',
                'MerchantFree1=' + merchantFree1,
                'MerchantFree2=' + merchantFree2,
                'MerchantFree3=' + orderNumber,
                'ProcNo=' + SonyPaymentHelper.getProcNo(),
                'TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode'),
                'PayType=01',
                'Amount=' + Math.round(amount),
                'RedirectUrl=' + enRedirectUrl,
                'PostUrl=' + enPostUrl
            ];
            if (req.session.privacyCache.get('sonySelectedCard')) {
                var uuid = req.session.privacyCache.get('sonySelectedCard');
                var kaiinId = uuid.substr(0, 11);
                var kaiinPass = sonyHashData(kaiinId, customer.ID);
                params.push('KaiinId=' + kaiinId);
                params.push('KaiinPass=' + kaiinPass);
            } else {
                params.push('Token=' + ordertoken);
            }
            var stringToEncrypt = params.join('&');

            var encValue = AESHelper.encode(stringToEncrypt);
            var merchantId = Site.getCurrent().getCustomPreferenceValue('sony_merchantID');

            req.session.privacyCache.set('sonyPaymentEncValue', encValue);

            return {
                error: false,
                waitResult: true,
                redirectUrl: URLUtils.url('SonyPayment-RedirectTo3dsecure').toString() + '?merchantId=' + merchantId
            };
        } else if (SonyPaymentHelper.masterAuthorization(order, amount, ordertoken, req)) {
            Transaction.wrap(function () {
                paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
            });
        } else {
            error = true;

            if (req.session.privacyCache.get('sonyPaymentErrorMessage')) {
                serverErrors.push(req.session.privacyCache.get('sonyPaymentErrorMessage'));
                req.session.privacyCache.set('sonyPaymentErrorMessage', null);
            } else {
                serverErrors.push(Resource.msg('error.technical', 'checkout', null));
            }
        }
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.createToken = createToken;
