'use strict';

var formValidation = require('base/components/formValidation');
var cleave = require('../components/cleave');
var base = require('base/paymentInstruments/paymentInstruments');
var url;
/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.cart-error').append(errorHtml);
}

/**
 * lock payment
 */
function lockPayment() {
    $('.lock-payment').on('click', function (e) {
        var thisButton = $(this);
        e.preventDefault();
        url = $(this).data('url') + '?UUID=' + $(this).data('id');
        var $resultActionInCard = $(this).parent().parent().find('.resultActionInCard');
        $(this).trigger('payment:lock', e);
        $('.resultActionInCard').empty();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                var toInsert = '';
                if (data.success) {
                    thisButton.parent().parent().find('.lock-payment').prop('disabled', true);
                    thisButton.parent().parent().find('.unlock-payment').prop('disabled', false);
                    thisButton.parent().parent().find('.edit-card').prop('disabled', true);
                    if (data.message) {
                        toInsert = '<div class="valid-feedback is-valid">'
                            + data.message + '</div>';
                        $resultActionInCard.prepend(toInsert);
                    }
                } else if (data.message) {
                    toInsert = '<div class="invalid-feedback is-invalid">'
                            + data.message + '</div>';
                    $resultActionInCard.prepend(toInsert);
                }
                $resultActionInCard.children().show();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
            }
        });
        return false;
    });
}
/**
 * unlock payment
 */
function unlockPayment() {
    $('.unlock-payment').on('click', function (e) {
        var thisButton = $(this);
        e.preventDefault();
        url = $(this).data('url') + '?UUID=' + $(this).data('id');
        var $resultActionInCard = $(this).parent().parent().find('.resultActionInCard');
        $(this).trigger('payment:unlock', e);
        $('.resultActionInCard').empty();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                var toInsert = '';
                if (data.success) {
                    thisButton.parent().parent().find('.lock-payment').prop('disabled', false);
                    thisButton.parent().parent().find('.unlock-payment').prop('disabled', true);
                    thisButton.parent().parent().find('.edit-card').prop('disabled', false);
                    if (data.message) {
                        toInsert = '<div class="valid-feedback is-valid">'
                            + data.message + '</div>';
                        $resultActionInCard.prepend(toInsert);
                    }
                } else if (data.message) {
                    toInsert = '<div class="invalid-feedback is-invalid">'
                            + data.message + '</div>';
                    $resultActionInCard.prepend(toInsert);
                }
                $resultActionInCard.children().show();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
            }
        });
        return false;
    });
}
/**
 * submit payment
 */
function submitPayment() {
    $('form.payment-form').submit(function (e) {
        e.preventDefault();
        var $form = $(this);
        $form.spinner().start();

        var cardNumber = $('[name*="dwfrm_creditCard_cardNumber"]').val();
        cardNumber = cardNumber.replace(/\s/g, '');
        var cardExpirationDate = {};
        var ccYear = $('[name*="dwfrm_creditCard_expirationYear"]').val();
        cardExpirationDate.year = ccYear.substr(ccYear.length - 2, ccYear.length);
        var ccMonth = $('[name*="dwfrm_creditCard_expirationMonth"]').val();
        cardExpirationDate.month = (ccMonth.length === 1) ? ('0' + ccMonth) : (ccMonth);

        var phoneNumber = $('[name*="dwfrm_creditCard_ccphone"]').length ? $('[name*="dwfrm_creditCard_ccphone"]').val() : '0000';
        var lastName = $('[name*="dwfrm_creditCard_lastnameKana"]').length ? $('[name*="dwfrm_creditCard_lastnameKana"]').val() : ' ';
        var firstName = $('[name*="dwfrm_creditCard_firstnameKana"]').length ? $('[name*="dwfrm_creditCard_firstnameKana"]').val() : ' ';
        var securityCode = $('[name*="dwfrm_creditCard_securityCode"]').length ? $('[name*="dwfrm_creditCard_securityCode"]').val() : null;
        var dateOfBirth = {};
        dateOfBirth.month = $('[name*="dwfrm_creditCard_birthdayMonth"]').length ? $('[name*="dwfrm_creditCard_birthdayMonth"]').val() : '01';
        dateOfBirth.day = $('[name*="dwfrm_creditCard_birthdayDay"]').length ? $('[name*="dwfrm_creditCard_birthdayDay"]').val() : '01';

        SpsvApi.spsvCreateToken(cardNumber, cardExpirationDate.year, cardExpirationDate.month, securityCode, dateOfBirth.month, dateOfBirth.day, phoneNumber, lastName, firstName);
        return false;
    });
}
/**
 * submit hidden payment
 */
function submitHiddenPayment() {
    $('form.payment-form-hidden').submit(function (e) {
        var $form = $('form.payment-form');
        e.preventDefault();

        url = $form.attr('action');
        $form.spinner().start();
        $('form.payment-form').trigger('payment:submit', e);

        var formData = cleave.serializeData($form);

        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: formData,
            success: function (data) {
                $form.spinner().stop();
                if (!data.success) {
                    $('.sony-payment-error-msg').empty();
                    if (data.errorMessage) {
                        $('.sony-payment-error-msg').prepend('<div class="alert alert-danger" role="alert">'
                            + data.errorMessage + '</div>');
                    } else {
                        formValidation($form, data);
                    }
                    $('[name*="dwfrm_creditCard_securityCode"]').val('');
                } else {
                    location.href = data.redirectUrl;
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $form.spinner().stop();
                }
                $('[name*="dwfrm_creditCard_securityCode"]').val('');
            }
        });
        return false;
    });
}
/**
 * redirect edit payment
 */
function redirectEditPayment() {
    $('.edit-card').on('click', function () {
        window.location.href = $(this).attr('href');
    });
}

if ($('.sony-payment-error-msg').children().length > 0) {
    $('[name*="dwfrm_creditCard_securityCode"]').val('');
}

base.lockPayment = lockPayment;
base.unlockPayment = unlockPayment;
base.submitPayment = submitPayment;
base.submitHiddenPayment = submitHiddenPayment;
base.redirectEditPayment = redirectEditPayment;
module.exports = base;
