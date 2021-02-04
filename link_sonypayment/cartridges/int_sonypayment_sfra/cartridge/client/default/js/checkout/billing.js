'use strict';

var base = require('base/checkout/billing');
var cleave = require('../components/cleave');   // eslint-disable-line

/**
 * Select save payment instrument
 */
function selectSavedPaymentInstrument() {
    $(document).on('click', '.saved-payment-instrument', function (e) {
        e.preventDefault();
        $('.saved-payment-security-code').val('');
        $('.saved-payment-instrument').removeClass('selected-payment');
        $(this).addClass('selected-payment');
        $('.saved-payment-instrument .card-image').removeClass('checkout-hidden');
        $('.saved-payment-instrument .security-code-input').addClass('checkout-hidden');
        $('[name="dwfrm_billing_creditCardFields_token"]').val('');
        $('[name="dwfrm_billing_creditCardFields_ordertoken"]').val('');
    });
}
/**
 * Add new payment instrument
 */
function addNewPaymentInstrument() {
    $('.btn.add-payment').on('click', function (e) {
        e.preventDefault();
        $('.payment-information').data('is-new-payment', true);
        clearCreditCardForm();
        $('.credit-card-form').removeClass('checkout-hidden');
        $('.user-payment-instruments').addClass('checkout-hidden');
        $('[name="dwfrm_billing_creditCardFields_token"]').val('');
        $('[name="dwfrm_billing_creditCardFields_ordertoken"]').val('');
    });
}
/**
 * Cancel new payment
 */
function cancelNewPayment() {
    $('.cancel-new-payment').on('click', function (e) {
        e.preventDefault();
        $('.payment-information').data('is-new-payment', false);
        clearCreditCardForm();
        $('.user-payment-instruments').removeClass('checkout-hidden');
        $('.credit-card-form').addClass('checkout-hidden');
        $('[name="dwfrm_billing_creditCardFields_token"]').val('');
        $('[name="dwfrm_billing_creditCardFields_ordertoken"]').val('');
    });
}

/**
 * clears the credit card form
 */
function clearCreditCardForm() {
    $('input[name$="_cardNumber"]').data('cleave').setRawValue('');
    $('select[name$="_expirationMonth"]').val('');
    $('select[name$="_expirationYear"]').val('');
    $('input[name$="_securityCode"]').val('');
}

base.selectSavedPaymentInstrument = selectSavedPaymentInstrument;
base.addNewPaymentInstrument = addNewPaymentInstrument;
base.cancelNewPayment = cancelNewPayment;
module.exports = base;
