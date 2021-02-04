'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.extend(module.superModule);


/**
 * Checks if a credit card is valid or not
 * @param {Object} req - request object
 * @param {Object} card - plain object with card details
 * @param {Object} form - form object
 * @returns {boolean} a boolean representing card validation
 */
function verifyCard(req, card, form) {
    var collections = require('*/cartridge/scripts/util/collections');
    var Resource = require('dw/web/Resource');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
    var PaymentInstrument = require('dw/order/PaymentInstrument');

    var currentCustomer = req.currentCustomer.raw;
    var countryCode = req.geolocation.countryCode;
    var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var paymentCard = PaymentMgr.getPaymentCard(card.cardType);
    var error = false;

    var applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
        currentCustomer,
        countryCode,
        null
    );

    var cardNumber = card.cardNumber;
    var cardSecurityCode = form.securityCode.value;
    var creditCardStatus;
    var formCardNumber = form.cardNumber;
    var formCardSecurityCode = form.securityCode;

    if (paymentCard) {
        if (applicablePaymentCards.contains(paymentCard)) {
            creditCardStatus = paymentCard.verify(
                card.expirationMonth,
                card.expirationYear,
                cardNumber,
                cardSecurityCode
            );
            if (isNaN(cardSecurityCode)) {
                creditCardStatus = dw.system.Status(1, 'CREDITCARD_INVALID_SECURITY_CODE');
            }
        } else {
            // Invalid Payment Instrument
            formCardNumber.valid = false;
            formCardNumber.error = Resource.msg('error.payment.not.valid', 'checkout', null);
            error = true;
        }
    } else {
        formCardNumber.valid = false;
        formCardNumber.error = Resource.msg('error.message.creditnumber.invalid', 'forms', null);
        error = true;
    }

    if (creditCardStatus && creditCardStatus.error) {
        collections.forEach(creditCardStatus.items, function (item) {
            switch (item.code) {
                case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                    formCardNumber.valid = false;
                    formCardNumber.error =
                        Resource.msg('error.message.creditnumber.invalid', 'forms', null);
                    error = true;
                    break;

                case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                    var expirationMonth = form.expirationMonth;
                    var expirationYear = form.expirationYear;
                    expirationMonth.valid = false;
                    expirationMonth.error =
                        Resource.msg('error.message.creditexpiration.expired', 'forms', null);
                    expirationYear.valid = false;
                    error = true;
                    break;

                case PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                    formCardSecurityCode.valid = false;
                    formCardSecurityCode.error =
                        Resource.msg('account.paymentinstrumentlist.wrongsecuritycode', 'account', null);
                    error = true;
                    break;
                default:
                    error = true;
            }
        });
    }

    return error;
}

/**
 * Creates an object from form values
 * @param {Object} paymentForm - form object
 * @returns {Object} a plain object of payment instrument
 */
function getDetailsObject(paymentForm) {
    return {
        name: paymentForm.cardOwner.value,
        cardNumber: paymentForm.cardNumber.value,
        cardType: paymentForm.cardType.value,
        expirationMonth: paymentForm.expirationMonth.value,
        expirationYear: paymentForm.expirationYear.value,
        paymentForm: paymentForm
    };
}

/**
 * Check limit and duplicate card for Sony Payment
 * @param {Object} req - request object
 * @param {Object} card - plain object with card details
 * @returns {Object}  - verify card
 */
function verifySonyPaymentCard(req, card) {
    var Resource = require('dw/web/Resource');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Site = require('dw/system/Site');
    var dwOrderPaymentInstrument = require('dw/order/PaymentInstrument');

    var cardNumber = card.cardNumber;
    var last4 = cardNumber.substring(cardNumber.length - 4);
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var wallet = customer.getProfile().getWallet();
    var savedCards = wallet.getPaymentInstruments(dwOrderPaymentInstrument.METHOD_CREDIT_CARD);

    // Check card limit
    var cardLimit = Site.getCurrent().getCustomPreferenceValue('sony_number_of_credit_card') || 3;
    if (savedCards.length >= cardLimit) {
        var errorMessage = Resource.msg('creditcards.limit.reached', 'forms', '');
        return {
            error: true,
            errorMessage: errorMessage + cardLimit,
            success: false
        };
    }

    // Check card duplicate
    for (var i = 0; i < savedCards.length; i++) {
        if (savedCards[i].getCreditCardNumberLastDigits() === last4) {
            return {
                error: true,
                errorMessage: Resource.msg('account.paymentinstrumentlist.cardhasexist', 'account_ja_JP', null),
                success: false
            };
        }
    }

    return {
        error: false,
        errorMessage: null
    };
}

server.prepend('SavePayment', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var Site = require('dw/system/Site');
    var sonyPaymentEnable = Site.getCurrent().getCustomPreferenceValue('sony_enable_catridge');
    var paymentForm = server.forms.getForm('creditCard');
    var result = getDetailsObject(paymentForm);
    // Check only create new payment
    if (sonyPaymentEnable && !req.querystring.UUID) {
        var verify = verifySonyPaymentCard(req, result);
        if (verify.error) {
            res.json({
                success: false,
                errorMessage: verify.errorMessage
            });
            this.emit('route:Complete', req, res);
            return;
        }
    }
    next();
});

/**
 * Removes a duplicate customer credit card payment instrument.
 * @param {Object} creditCardFields - credit card fields
 * @returns {void} - remove duplicates
 */
function removeDuplicates(creditCardFields) {
    var wallet = customer.getProfile().getWallet();
    var paymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD).toArray().sort(function (a, b) {
        return b.getCreationDate() - a.getCreationDate();
    });
    var ccNumber = creditCardFields.cardNumber;
    var isDuplicateCard = false;
    var oldCard;

    for (var i = 0; i < paymentInstruments.length; i++) {
        var card = paymentInstruments[i];
        if (card.creditCardExpirationMonth === creditCardFields.expirationMonth && card.creditCardExpirationYear === creditCardFields.expirationYear
            && card.creditCardType === creditCardFields.cardType && (card.getCreditCardNumber().indexOf(ccNumber.substring(ccNumber.length - 4)) > 0)) {
            isDuplicateCard = true;
            oldCard = card;
            break;
        }
    }
    if (isDuplicateCard) {
        wallet.removePaymentInstrument(oldCard);
    }
}

server.append('SavePayment', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    var HookMgr = require('dw/system/HookMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var dwOrderPaymentInstrument = require('dw/order/PaymentInstrument');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var Site = require('dw/system/Site');

    var paymentForm = server.forms.getForm('creditCard');
    var result = getDetailsObject(paymentForm);
    var sonyPaymentEnable = Site.getCurrent().getCustomPreferenceValue('sony_enable_catridge');

    if (paymentForm.valid && !verifyCard(req, result, paymentForm)) {
        res.setViewData(result);
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var URLUtils = require('dw/web/URLUtils');
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var Transaction = require('dw/system/Transaction');
            var SonyPaymentHelper = require('*/cartridge/scripts/helpers/sonyPaymentHelper');
            var AESHelper = require('*/cartridge/scripts/helpers/AESHelper');
            var Calendar = require('dw/util/Calendar');
            var Encoding = require('dw/crypto/Encoding');
            var StringUtils = require('dw/util/StringUtils');

            var formInfo = res.getViewData();
            var cardNumber = formInfo.cardNumber;
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var wallet = customer.getProfile().getWallet();

            removeDuplicates(formInfo);
            try {
                Transaction.begin();
                var paymentInstrument = wallet.createPaymentInstrument(dwOrderPaymentInstrument.METHOD_CREDIT_CARD);
                paymentInstrument.setCreditCardHolder(formInfo.name);
                paymentInstrument.setCreditCardNumber(formInfo.cardNumber);
                paymentInstrument.setCreditCardType(formInfo.cardType);
                paymentInstrument.setCreditCardExpirationMonth(formInfo.expirationMonth);
                paymentInstrument.setCreditCardExpirationYear(formInfo.expirationYear);

                if (Site.getCurrent().getCustomPreferenceValue('sony_enable_card_attributes')) {
                    paymentInstrument.custom.creditCardBirthdayDay = formInfo.paymentForm.birthdayDay.value;
                    paymentInstrument.custom.creditCardBirthdayMonth = formInfo.paymentForm.birthdayMonth.value;
                    paymentInstrument.custom.creditCardPhone = formInfo.paymentForm.ccphone.value;
                    paymentInstrument.custom.creditCardKanaName = formInfo.paymentForm.firstnameKana.value;
                    paymentInstrument.custom.creditCardLastKanaName = formInfo.paymentForm.lastnameKana.value;
                }

                var processor = PaymentMgr.getPaymentMethod(dwOrderPaymentInstrument.METHOD_CREDIT_CARD).getPaymentProcessor();
                var token = null;
                if (sonyPaymentEnable) {
                    token = formInfo.paymentForm.token.value;
                    paymentInstrument.setCreditCardToken(token);
                    if (Site.getCurrent().getCustomPreferenceValue('sony_enable_3dsecure')) {
                        var merchantFree1 = !empty(Site.getCurrent().getCustomPreferenceValue('sony_merchantFree')) ? Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') : '';
                        var merchantFree2 = !empty(Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) ? Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') : '';

                        var calendar = new Calendar();
                        var hours = Site.current.getTimezoneOffset() / 3600000;
                        calendar.add(Calendar.HOUR, hours);
                        var encTransactionDate = Encoding.toURI(StringUtils.formatCalendar(calendar, 'yyyyMMdd'));

                        var params = [
                            'MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW'),
                            'TransactionDate=' + encTransactionDate,
                            'OperateId=4MemAdd',
                            'MerchantFree1=' + merchantFree1,
                            'MerchantFree2=' + merchantFree2,
                            'TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode'),
                            'RedirectUrl=' + Site.getCurrent().getCustomPreferenceValue('3dManageCardRedirectURL'),
                            'PostUrl=' + Site.getCurrent().getCustomPreferenceValue('3dManageCardPostURL'),
                            'ProcNo=' + SonyPaymentHelper.getProcNo()
                        ];
                        params.push('Token=' + token);

                        req.session.privacyCache.set('ccUUID', paymentInstrument.UUID);
                        var kaiinId = paymentInstrument.UUID.substr(0, 11);
                        var kaiinPass = SonyPaymentHelper.sonyHashData(kaiinId, customer.ID);
                        params.push('KaiinId=' + kaiinId);
                        params.push('KaiinPass=' + kaiinPass);

                        var stringToEncrypt = params.join('&');

                        var encValue = AESHelper.encode(stringToEncrypt);
                        var merchantId = Site.getCurrent().getCustomPreferenceValue('sony_merchantID');

                        req.session.privacyCache.set('sonyPaymentEncValue', encValue);

                        res.json({
                            success: true,
                            redirectUrl: URLUtils.url('SonyPayment-RedirectTo3dsecure').toString() + '?merchantId=' + merchantId
                        });

                        if (req.querystring.UUID) {
                            req.session.privacyCache.set('editPaymentId', req.querystring.UUID);
                        }

                        return;
                    }
                    if (!SonyPaymentHelper.newMemberToken(paymentInstrument, cardNumber, token, req)) {
                        Transaction.commit();
                        Transaction.wrap(function () {
                            wallet.removePaymentInstrument(paymentInstrument);
                        });
                        res.json({
                            success: false,
                            errorMessage: !empty(req.session.privacyCache.get('sonyPaymentErrorMessage')) ? req.session.privacyCache.get('sonyPaymentErrorMessage') : ''
                        });
                        req.session.privacyCache.set('sonyPaymentErrorMessage', null);
                        return;
                    }
                } else {
                    token = HookMgr.callHook(
                        'app.payment.processor.' + processor.ID.toLowerCase(),
                        'createToken'
                    );

                    paymentInstrument.setCreditCardToken(token);
                }

                Transaction.commit();
            } catch (err) {
                res.json({
                    success: false,
                    errorMessage: err.message
                });
                return;
            }

            if (req.querystring.UUID) {
                var array = require('*/cartridge/scripts/util/array');
                var UUID = req.querystring.UUID;
                var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
                var creditCardPaymentInstrument = array.find(paymentInstruments, function (item) {
                    return UUID === item.UUID;
                });
                Transaction.wrap(function () {
                    wallet.removePaymentInstrument(creditCardPaymentInstrument.raw);
                });
            }

            // Send account edited email
            accountHelpers.sendAccountEditedEmail(customer.profile);

            res.json({
                success: true,
                redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
            });
        });
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(paymentForm)
        });
    }
    return next();
});

server.append('List', userLoggedIn.validateLoggedIn, function (req, res, next) {
    var AccountModel = require('*/cartridge/models/account');
    var accountModel = new AccountModel(req.currentCustomer);

    var viewData = res.getViewData();
    viewData.customer = accountModel;
    res.setViewData(viewData);

    next();
});

server.prepend('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var array = require('*/cartridge/scripts/util/array');
    var UUID = req.querystring.UUID;
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;

    var paymentToDelete = array.find(paymentInstruments, function (item) {
        return UUID === item.UUID;
    });

    var Site = require('dw/system/Site');
    var sonyPaymentEnable = Site.getCurrent().getCustomPreferenceValue('sony_enable_catridge');
    var SonyPaymentHelper = require('*/cartridge/scripts/helpers/sonyPaymentHelper');
    if (sonyPaymentEnable && paymentToDelete) {
        SonyPaymentHelper.deleteCard(paymentToDelete);
    }
    next();
});

module.exports = server.exports();
