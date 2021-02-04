'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

// Send the Error Message to checkout.isml
server.append(
    'Begin',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var Site = require('dw/system/Site');
        var viewData = res.getViewData();

        var AccountModel = require('*/cartridge/models/account');
        var SonyPaymentCheckoutHelper = require('*/cartridge/scripts/helpers/sonyPaymentCheckoutHelper');
        var accountModel = new AccountModel(req.currentCustomer);
        viewData.memberInfoList = SonyPaymentCheckoutHelper.getMemberInfoList(accountModel);
        viewData.isSaveCard = true;
        if (req.currentCustomer.raw.authenticated
            && req.currentCustomer.raw.registered
            && req.currentCustomer.raw.profile.wallet.paymentInstruments.getLength()
        ) {
            var cardLimit = Site.getCurrent().getCustomPreferenceValue('sony_number_of_credit_card') || 3;
            var creditCards = customer.getProfile().getWallet().getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
            if (creditCards.length >= cardLimit) {
                viewData.isSaveCard = false;
            }
        }

        if (req.session.privacyCache.get('sonySecureErrorMessage')) {
            viewData.sonySecureErrorMessage = req.session.privacyCache.get('sonySecureErrorMessage');
            req.session.privacyCache.set('sonySecureErrorMessage', null);
        }

        res.setViewData(viewData);
        next();
    }
);


module.exports = server.exports();
