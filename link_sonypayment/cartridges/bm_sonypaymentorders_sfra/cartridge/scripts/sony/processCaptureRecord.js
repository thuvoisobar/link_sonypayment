/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable consistent-return */
/**
*
*	Handles Pipeline call for cancel order authorized
*
*	@input  SelectedOrderList : dw.util.ArrayList
*	@output SonyErrorMessage : String error Message
*	@output orderSuccess : Array list of Order success
*	@output orderFailed : Array list of order failed

*/

var Logger = require('dw/system/Logger');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Order = require('dw/order/Order');
var Resource = require('dw/web/Resource');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

/**
 * excute function
 * @param {Object} pdict pdict
 * @returns {Object} object
 */
function execute(pdict) {
    var SelectedOrderList = pdict.SelectedOrderList;
    var SonyErrorMessage = '';
    var orderSuccess = [];
    var orderFailed = [];
    var SonyPaymentService = require('int_sonypayment_sfra/cartridge/scripts/services/sonyPaymentService');


    for (var i = 0; i < SelectedOrderList.length; i++) {
        var order = OrderMgr.getOrder(SelectedOrderList[i]);
        var service = SonyPaymentService.createCaptureRecordService();
        var capturedResult = processCapture(order, service);
        if (capturedResult.captured) {
            orderSuccess.push(order.orderNo);
        } else {
            orderFailed.push(order.orderNo);
            SonyErrorMessage += capturedResult.error;
        }
    }

    return {
        orderSuccess: orderSuccess,
        orderFailed: orderFailed,
        SonyErrorMessage: SonyErrorMessage
    };
}

/**
 * @description Capture Order
 * @param {Object} order order
 * @param {Service} service service
 * @returns {Object} Object
 */
function processCapture(order, service) {
    try {
        var sName = 'SONY.CaptureRecord';
        var params = [
            'ProcessId=' + order.custom.sonyProcessId,
            'ProcessPass=' + order.custom.sonyProcessPass,
            'MerchantFree3=' + order.orderNo
        ];
        if (order.custom.kaiinId) {
            var SonyPaymentHelper = require('int_sonypayment_sfra/cartridge/scripts/helpers/sonyPaymentHelper');
            var customerId = order.getCustomer().ID;
            var kaiinPass = SonyPaymentHelper.sonyHashData(order.custom.kaiinId, customerId);
            if (kaiinPass) {
                params.push('KaiinId=' + order.custom.kaiinId);
                params.push('KaiinPass=' + kaiinPass);
            }
        }

        service.URL += '&' + params.join('&');
        var result = service.call();

        if (result.ok && result.status === 'OK') {
            var resultObj = parseString(result.object.text);
            var transactionId = resultObj.TransactionId;

            // if capture successfully
            if (resultObj.ResponseCd.toLowerCase() === 'ok') {
                var paymentInstruments = order.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD).toArray();
                var paymentInstrument = paymentInstruments[0];
                var paymentTransaction = paymentInstrument.getPaymentTransaction();

                Transaction.wrap(function () {
                    // update order information
                    order.custom.sonyPaymentStatusIsAuth = false;
                    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                    order.setExportStatus(Order.EXPORT_STATUS_READY);
                    paymentTransaction.transactionID = transactionId;
                    paymentTransaction.custom.CompanyCd = resultObj.CompanyCd;
                });
                Logger.getLogger('SONY', 'SONY').debug('\n{0} capture successfully! \n{1}', sName, getOrderInfo(order));
                return { captured: true };
            }
            var errorMessage = '</br>Order ' + order.orderNo + ': ' + getErrorMessage(resultObj.ResponseCd);
            Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: = {1} \n{2}', sName, resultObj.ResponseCd, getOrderInfo(order));
            return { captured: false, error: errorMessage };
        }
    } catch (e) {
        Logger.error('processCaptureRecord.js: Error while process capture Order {0}. Error message: {1}', order.orderNo, e.message);
        return { captured: false, error: e.message };
    }
}

/**
 * Get Error Message from Sony Payment
 *
 * @param {string} responseCodes string
 * @returns {string} form encoded parameter string
 */
function getErrorMessage(responseCodes) {
    var errorMessage = '';
    var errorCodes = responseCodes.split('|');
    for (var i = 0; i < errorCodes.length; i++) {
        errorMessage = errorMessage + Resource.msg('error.msg.' + errorCodes[i], 'checkout', null) + '</br>';
    }
    return errorMessage;
}

/**
 * @description  show info of order
 * @param {Order} order order
 * @returns {string} string
 */
function getOrderInfo(order) {
    return 'Order No = ' + order.orderNo + ', order status = ' + order.status.displayValue + ', payment status = ' + order.paymentStatus.displayValue;
}

/**
 * @description  parseString
 * @param {string} str string
 * @returns {Object} Object
 */
function parseString(str) {
    var resultArr = str.split('&');
    var resultObj = {};
    var eArr = null;

    resultArr.forEach(function (e) {
        eArr = e.split('=');
        resultObj[eArr[0]] = eArr[1];
    });
    // for each(var e in resultArr) {
    //     eArr = e.split('=');
    //     resultObj[eArr[0]] = eArr[1];
    // }

    return resultObj;
}

module.exports = {
    execute: execute
};
