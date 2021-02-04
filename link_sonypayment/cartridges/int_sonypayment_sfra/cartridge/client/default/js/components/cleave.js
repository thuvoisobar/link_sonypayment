'use strict';

var base = require('base/components/cleave');
/**
 * @param {Object} cardFieldSelector card field
 * @param {Object} cardTypeSelector card type
 * @returns {void} handle credit card number
 */
function handleCreditCardNumber(cardFieldSelector, cardTypeSelector) {
    var cleave = new Cleave(cardFieldSelector, {
        creditCard: true,
        onCreditCardTypeChanged: function (type) {
            var creditCardTypes = {
                visa: 'Visa',
                mastercard: 'Master Card',
                amex: 'Amex',
                discover: 'Discover',
                jcb: 'JCB',
                unknown: 'Unknown'
            };

            var cardType = creditCardTypes[Object.keys(creditCardTypes).indexOf(type) > -1
                ? type
                : 'unknown'];
            $(cardTypeSelector).val(cardType);
            $('.card-number-wrapper').attr('data-type', type);
            if (type === 'visa' || type === 'mastercard' || type === 'discover' || type === 'jcb') {
                $('#securityCode').attr('maxlength', 3);
            } else {
                $('#securityCode').attr('maxlength', 4);
            }
        }
    });

    $(cardFieldSelector).data('cleave', cleave);
}
base.handleCreditCardNumber = handleCreditCardNumber;
module.exports = base;
