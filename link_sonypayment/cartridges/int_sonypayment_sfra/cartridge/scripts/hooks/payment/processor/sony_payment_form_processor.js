'use strict';

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Site = require('dw/system/Site');

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var array = require('*/cartridge/scripts/util/array');
    var sonyEnableCardAttributes = Site.getCurrent().getCustomPreferenceValue('sony_enable_card_attributes');

    var viewData = viewFormData;
    var creditCardErrors = {};

    if (!req.form.storedPaymentUUID) {
        // verify credit card form data
        creditCardErrors = COHelpers.validateCreditCard(paymentForm);
    }

    if (Object.keys(creditCardErrors).length) {
        return {
            fieldErrors: creditCardErrors,
            error: true
        };
    }

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    viewData.paymentInformation = {
        cardType: {
            value: paymentForm.creditCardFields.cardType.value,
            htmlName: paymentForm.creditCardFields.cardType.htmlName
        },
        cardNumber: {
            value: paymentForm.creditCardFields.cardNumber.value,
            htmlName: paymentForm.creditCardFields.cardNumber.htmlName
        },
        securityCode: {
            value: paymentForm.creditCardFields.securityCode.value,
            htmlName: paymentForm.creditCardFields.securityCode.htmlName
        },
        expirationMonth: {
            value: parseInt(
                paymentForm.creditCardFields.expirationMonth.selectedOption,
                10
            ),
            htmlName: paymentForm.creditCardFields.expirationMonth.htmlName
        },
        expirationYear: {
            value: parseInt(paymentForm.creditCardFields.expirationYear.value, 10),
            htmlName: paymentForm.creditCardFields.expirationYear.htmlName
        }
    };

    if (sonyEnableCardAttributes) {
        viewData.paymentInformation = {
            creditCardLastKanaName: {
                value: paymentForm.creditCardFields.lastnameKana.value,
                htmlName: paymentForm.creditCardFields.lastnameKana.htmlName
            },
            creditCardKanaName: {
                value: paymentForm.creditCardFields.firstnameKana.value,
                htmlName: paymentForm.creditCardFields.firstnameKana.htmlName
            },
            creditCardPhone: {
                value: paymentForm.creditCardFields.ccphone.value,
                htmlName: paymentForm.creditCardFields.ccphone.htmlName
            },
            creditCardBirthdayDay: {
                value: parseInt(paymentForm.creditCardFields.birthdayDay.selectedOption, 10),
                htmlName: paymentForm.creditCardFields.birthdayDay.htmlName
            },
            creditCardBirthdayMonth: {
                value: parseInt(paymentForm.creditCardFields.birthdayMonth.value, 10),
                htmlName: paymentForm.creditCardFields.birthdayMonth.htmlName
            }
        };
    }

    if (req.form.storedPaymentUUID) {
        req.session.privacyCache.set('sonySelectedCard', req.form.storedPaymentUUID);
        viewData.storedPaymentUUID = req.form.storedPaymentUUID;
    } else {
        req.session.privacyCache.set('sonySelectedCard', null);
    }

    viewData.saveCard = paymentForm.creditCardFields.saveCard.checked;

    // process payment information
    if (viewData.storedPaymentUUID
        && req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered
    ) {
        var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
        var paymentInstrument = array.find(paymentInstruments, function (item) {
            return viewData.storedPaymentUUID === item.UUID;
        });

        viewData.paymentInformation.cardNumber.value = paymentInstrument.creditCardNumber;
        viewData.paymentInformation.cardType.value = paymentInstrument.creditCardType;
        viewData.paymentInformation.securityCode.value = req.form.securityCode;
        viewData.paymentInformation.expirationMonth.value = paymentInstrument.creditCardExpirationMonth;
        viewData.paymentInformation.expirationYear.value = paymentInstrument.creditCardExpirationYear;
        viewData.paymentInformation.creditCardToken = paymentInstrument.raw.creditCardToken;

        if (sonyEnableCardAttributes) {
            viewData.paymentInformation.creditCardBirthdayDay.value = paymentInstrument.raw.custom.hasOwnProperty('creditCardBirthdayDay') ? paymentInstrument.raw.custom.creditCardBirthdayDay : '01';
            viewData.paymentInformation.creditCardBirthdayMonth.value = paymentInstrument.raw.custom.hasOwnProperty('creditCardBirthdayMonth') ? paymentInstrument.raw.custom.creditCardBirthdayMonth : '01';
            viewData.paymentInformation.creditCardPhone.value = paymentInstrument.raw.custom.hasOwnProperty('creditCardPhone') ? paymentInstrument.raw.custom.creditCardPhone : '';
            viewData.paymentInformation.creditCardKanaName.value = paymentInstrument.raw.custom.hasOwnProperty('creditCardKanaName') ? paymentInstrument.raw.custom.creditCardKanaName : '';
            viewData.paymentInformation.creditCardLastKanaName.value = paymentInstrument.raw.custom.hasOwnProperty('creditCardLastKanaName') ? paymentInstrument.raw.custom.creditCardLastKanaName : '';
        }
    } else {
        req.session.privacyCache.set('sonySelectedCard', req.form.storedPaymentUUID ? req.form.storedPaymentUUID : null);
    }

    return {
        error: false,
        viewData: viewData
    };
}

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 */
function savePaymentInformation(req, basket, billingData) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var dwOrderPaymentInstrument = require('dw/order/PaymentInstrument');

    if (!billingData.storedPaymentUUID
        && req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered
        && billingData.saveCard
        && (billingData.paymentMethod.value === 'CREDIT_CARD')
    ) {
        var sonyPaymentEnable = Site.getCurrent().getCustomPreferenceValue('sony_enable_catridge');
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        if (sonyPaymentEnable) {
            var creditCards = customer.getProfile().getWallet().getPaymentInstruments(dwOrderPaymentInstrument.METHOD_CREDIT_CARD);

            // Check card limit
            var cardLimit = Site.getCurrent().getCustomPreferenceValue('sony_number_of_credit_card') || 3;
            if (creditCards.length >= cardLimit) {
                return;
            }

            // Check card duplicate
            var cardNumber = billingData.paymentInformation.cardNumber.value;
            var last4 = cardNumber.substring(cardNumber.length - 4);
            for (var i = 0; i < creditCards.length; i++) {
                if (creditCards[i].getCreditCardNumberLastDigits() === last4) {
                    return;
                }
            }
        }

        var SonyPaymentCheckoutHelper = require('*/cartridge/scripts/helpers/sonyPaymentCheckoutHelper');
        var saveCardResult = SonyPaymentCheckoutHelper.savePaymentInstrumentToWallet(
            billingData,
            basket,
            customer,
            req
        );

        if (saveCardResult.creditCardHolder === null) {
            return;
        }

        req.session.privacyCache.set('ccUUID', saveCardResult.UUID);

        req.currentCustomer.wallet.paymentInstruments.push({
            creditCardHolder: saveCardResult.creditCardHolder,
            maskedCreditCardNumber: saveCardResult.maskedCreditCardNumber,
            creditCardType: saveCardResult.creditCardType,
            creditCardExpirationMonth: saveCardResult.creditCardExpirationMonth,
            creditCardExpirationYear: saveCardResult.creditCardExpirationYear,
            UUID: saveCardResult.UUID,
            creditCardNumber: Object.hasOwnProperty.call(
                saveCardResult,
                'creditCardNumber'
            )
                ? saveCardResult.creditCardNumber
                : null,
            raw: saveCardResult
        });
    }
}

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
