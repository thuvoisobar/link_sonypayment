'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../mocks/dw.util.Collection');
var collections = require('../../../mocks/util/collections');
var mockSuperModule = require('../../../mockModuleSuperModule');
var basePaymentModelMock = require('../../../mocks/models/basePayment');

var PaymentModel;

var paymentMethods = new ArrayList([
    {
        ID: 'CREDIT_CARD',
        name: 'Credit Card'
    }
]);

var paymentInstruments = new ArrayList([
    {
        creditCardNumberLastDigits: '0040',
        creditCardHolder: 'Name',
        creditCardExpirationYear: '2025',
        creditCardType: 'Visa',
        maskedCreditCardNumber: '************0040',
        paymentMethod: 'CREDIT_CARD',
        creditCardExpirationMonth: 1,
        paymentTransaction: {
            amount: {
                value: 0
            }
        }
    }
]);

function createApiBasket(options) {
    var basket = {
        totalGrossPrice: {
            value: 'some value'
        }
    };

    if (options && options.paymentMethods) {
        basket.paymentMethods = options.paymentMethods;
    }

    if (options && options.paymentCards) {
        basket.paymentCards = options.paymentCards;
    }

    if (options && options.paymentInstruments) {
        basket.paymentInstruments = options.paymentInstruments;
    }

    return basket;
}

describe('Payment Model', function () {
    before(function () {
        mockSuperModule.create(basePaymentModelMock);
        PaymentModel = proxyquire('../../../../cartridges/int_sonypayment_sfra/cartridge/models/payment', {
            '*/cartridge/scripts/util/collections': collections,
            'dw/order/PaymentMgr': {
                getApplicablePaymentMethods: function () {
                    return [
                        {
                            ID: 'CREDIT_CARD',
                            name: 'Credit Card',
                            imageURL: ''
                        }
                    ];
                },
                getPaymentMethod: function () {
                    return {
                        getApplicablePaymentCards: function () {
                            return [
                                {
                                    cardType: 'Visa',
                                    name: 'Visa',
                                    UUID: 'some UUID'
                                },
                                {
                                    cardType: 'Amex',
                                    name: 'American Express',
                                    UUID: 'some UUID'
                                },
                                {
                                    cardType: 'Master Card',
                                    name: 'MasterCard'
                                },
                                {
                                    cardType: 'JCB',
                                    name: 'JCB'
                                }
                            ];
                        }
                    };
                },
                getApplicablePaymentCards: function () {
                    return ['applicable payment cards'];
                }
            }
        });
    });

    after(function () {
        mockSuperModule.remove();
    });

    it('should take payment Methods and convert to a plain object ', function () {
        var result = new PaymentModel(createApiBasket({ paymentMethods: paymentMethods }), null);
        assert.equal(result.applicablePaymentMethods.length, 3);
        assert.equal(result.applicablePaymentMethods[1].ID, 'CREDIT_CARD');
        assert.equal(result.applicablePaymentMethods[1].name, 'Credit Card');
        assert.equal(result.applicablePaymentMethods[2].imageURL, '');
    });

    it('should take payment instruments and convert to a plain object ', function () {
        var result = new PaymentModel(createApiBasket({ paymentInstruments: paymentInstruments }), null);
        assert.equal(
            result.selectedPaymentInstruments.length, 3
        );
        assert.equal(result.selectedPaymentInstruments[0].lastFour, '0040');
        assert.equal(result.selectedPaymentInstruments[0].owner, 'Name');
        assert.equal(result.selectedPaymentInstruments[0].expirationYear, '2025');
        assert.equal(result.selectedPaymentInstruments[0].type, 'Visa');
        assert.equal(
            result.selectedPaymentInstruments[0].maskedCreditCardNumber,
            '************0040'
        );
        assert.equal(result.selectedPaymentInstruments[0].paymentMethod, 'CREDIT_CARD');
        assert.equal(result.selectedPaymentInstruments[0].expirationMonth, 1);
        assert.equal(result.selectedPaymentInstruments[0].amount, 0);

        assert.equal(result.selectedPaymentInstruments[1].giftCertificateCode, 'someString');
        assert.equal(
            result.selectedPaymentInstruments[1].maskedGiftCertificateCode,
            'some masked string'
        );
    });
});
