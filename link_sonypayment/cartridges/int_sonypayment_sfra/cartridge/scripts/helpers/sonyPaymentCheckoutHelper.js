/* eslint-disable no-continue */
/* eslint-disable default-case */
'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var HookMgr = require('dw/system/HookMgr');

var SonyPaymentCheckoutHelper = {
    /**
     * @description Invalidates the payment card form element in case specified status is ERROR.
     * If status is undefined or form is invalid the pipelet returns PIPELET_ERROR.
     *
     * @param {dw.system.Status} status : dw.system.Status The status object.
     * @param  {dw.web.FormGroup} creditCardForm : dw.web.FormGroup The credit card form.
     *
     * @returns {boolean}  true of false
     */
    invalidatePaymentCardFormElements: function (status, creditCardForm) {
        var Status = require('dw/system/Status');
        var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');

        // verify that we have a status object and a valid credit card form
        if (!status || !creditCardForm.isValid()) {
            return false;
        }

        // we are fine, if status is OK
        if (status.status === Status.OK) {
            return true;
        }

        // invalidate the payment card form elements
        var items = status.items.iterator();
        while (items.hasNext()) {
            var item = items.next();

            switch (item.code) {
                case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                    creditCardForm.object.number.invalidateFormElement();
                    continue;

                case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                    creditCardForm.object.expiration.month.invalidateFormElement();
                    creditCardForm.object.expiration.year.invalidateFormElement();
                    continue;

                case PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                    creditCardForm.object.cvn.invalidateFormElement();
            }
        }
        if (isNaN(creditCardForm.object.cvn.htmlValue)) {
            creditCardForm.object.cvn.invalidateFormElement();
        }
        return true;
    },
    /**
     * @description Saves payment instruemnt to customers wallet
     *
     * @param {Object} billingData - billing information entered by the user
     * @param {dw.order.Basket} currentBasket - The current basket
     * @param {dw.customer.Customer} customer - The current customer
     * @param {Object} req - request
     * @returns {dw.customer.CustomerPaymentInstrument} newly stored payment Instrument
     */
    savePaymentInstrumentToWallet: function (billingData, currentBasket, customer, req) {
        var wallet = customer.getProfile().getWallet();

        return Transaction.wrap(function () {
            var storedPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);

            storedPaymentInstrument.setCreditCardHolder(
                currentBasket.billingAddress.fullName
            );
            storedPaymentInstrument.setCreditCardNumber(
                billingData.paymentInformation.cardNumber.value
            );
            storedPaymentInstrument.setCreditCardType(
                billingData.paymentInformation.cardType.value
            );
            storedPaymentInstrument.setCreditCardExpirationMonth(
                billingData.paymentInformation.expirationMonth.value
            );
            storedPaymentInstrument.setCreditCardExpirationYear(
                billingData.paymentInformation.expirationYear.value
            );

            if (Site.getCurrent().getCustomPreferenceValue('sony_enable_card_attributes')) {
                storedPaymentInstrument.custom.creditCardBirthdayDay = billingData.paymentInformation.creditCardBirthdayDay.value;
                storedPaymentInstrument.custom.creditCardBirthdayMonth = billingData.paymentInformation.creditCardBirthdayMonth.value;
                storedPaymentInstrument.custom.creditCardPhone = billingData.paymentInformation.creditCardPhone.value;
                storedPaymentInstrument.custom.creditCardKanaName = billingData.paymentInformation.creditCardKanaName.value;
                storedPaymentInstrument.custom.creditCardLastKanaName = billingData.paymentInformation.creditCardLastKanaName.value;
            }

            var tokenSaveCard = billingData.paymentInformation.creditCardToken.value ? billingData.paymentInformation.creditCardToken.value : billingData.paymentInformation.creditCardToken;
            storedPaymentInstrument.setCreditCardToken(tokenSaveCard);
            var SonyPaymentHelper = require('*/cartridge/scripts/helpers/sonyPaymentHelper');
            if (!SonyPaymentHelper.newMemberToken(
                storedPaymentInstrument,
                billingData.paymentInformation.cardNumber.value,
                tokenSaveCard,
                req)) {
                wallet.removePaymentInstrument(storedPaymentInstrument);
            }

            return storedPaymentInstrument;
        });
    },
    /**
     * handles the payment authorization for each payment instrument
     * @param {dw.order.Order} order - the order object
     * @param {string} orderNumber - The order number for the order
     * @param {Object} req - request
     * @returns {Object} an error object
     */
    handlePayments: function (order, orderNumber, req) {
        var result = {};

        if (order.totalNetPrice !== 0.00) {
            var paymentInstruments = order.paymentInstruments;

            if (paymentInstruments.length === 0) {
                Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
                result.error = true;
            }

            if (!result.error) {
                for (var i = 0; i < paymentInstruments.length; i++) {
                    var paymentInstrument = paymentInstruments[i];
                    var paymentProcessor = PaymentMgr
                        .getPaymentMethod(paymentInstrument.paymentMethod)
                        .paymentProcessor;
                    var authorizationResult;
                    if (paymentProcessor === null) {
                        Transaction.begin();
                        paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                        Transaction.commit();
                    } else {
                        if (HookMgr.hasHook('app.payment.processor.' +
                            paymentProcessor.ID.toLowerCase())) {
                            authorizationResult = HookMgr.callHook(
                                'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                                'Authorize',
                                orderNumber,
                                paymentInstrument,
                                paymentProcessor,
                                req
                            );
                        } else {
                            authorizationResult = HookMgr.callHook(
                                'app.payment.processor.default',
                                'Authorize'
                            );
                        }

                        result = authorizationResult;
                        if (authorizationResult.error) {
                            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
                            result.error = true;
                            break;
                        }
                    }
                }
            }
        }

        return result;
    },
    /**
     * @description Get number credit card saved of customer.
     *
     * @returns {number} numberCreditCard
     */
    getNumberOfCreditCard: function () {
        var numberCreditCard = 0;
        if (customer.authenticated) {
            try {
                var creditCards = customer.getProfile().getWallet().getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
                if (creditCards) {
                    numberCreditCard = creditCards.length;
                }
            } catch (e) {
                Logger.debug('Can not get number of credit card saved in customer account. Error msg: ' + e.message);
            }
        }
        return numberCreditCard;
    },
    /**
     * renders the user's stored payment Instruments
     * @param {Object} accountModel - The account model
     * @returns {string|null} newly stored payment Instrument
     */
    getMemberInfoList: function (accountModel) {
        var SonyPaymentHelper = require('*/cartridge/scripts/helpers/sonyPaymentHelper');

        var memberInfoList = [];
        if (accountModel.customerPaymentInstruments && accountModel.customerPaymentInstruments.length) {
            accountModel.customerPaymentInstruments.forEach(function (payInstrument) {
                var memberInfo = SonyPaymentHelper.viewMember(null, payInstrument.UUID);
                if (memberInfo.KaiinStatus !== 1 && memberInfo.KaiinStatus !== 3) {
                    memberInfoList.push(payInstrument);
                }
            });
        }
        return memberInfoList;
    },

    /**
     * renders the user's stored payment Instruments
     * @param {Object} req - The request object
     * @param {Object} accountModel - The account model for the current customer
     * @returns {string|null} newly stored payment Instrument
     */
    getRenderedPaymentInstruments: function (req, accountModel) {
        var result;

        if (req.currentCustomer.raw.authenticated
            && req.currentCustomer.raw.registered
            && req.currentCustomer.raw.profile.wallet.paymentInstruments.getLength()
        ) {
            var context;
            var template = 'checkout/billing/storedPaymentInstruments';

            var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
            var memberInfoList = this.getMemberInfoList(accountModel);

            context = {
                customer: accountModel,
                memberInfoList: memberInfoList
            };
            result = renderTemplateHelper.getRenderedHtml(
                context,
                template
            );
        }

        return result || null;
    }
};

/**
 * exports modules
 */
module.exports = SonyPaymentCheckoutHelper;
