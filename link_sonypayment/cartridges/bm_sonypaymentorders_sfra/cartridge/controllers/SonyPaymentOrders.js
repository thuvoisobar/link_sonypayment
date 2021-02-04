'use strict';

/* API Includes */
var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var OrderMgr = require('dw/order/OrderMgr');
var OrderAPI = require('dw/order/Order');
var PagingModel = require('dw/web/PagingModel');
var ISML = require('dw/template/ISML');
var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * @description Query Orders
 * @returns {Object} - Object
 */
function getOrders() {
    var query = '( status = {0} OR status = {1} ) AND paymentStatus = {2} AND custom.sonyPaymentStatusIsAuth = {3}';
    var orders = SystemObjectMgr.querySystemObjects('Order', query, 'creationDate desc', OrderAPI.ORDER_STATUS_NEW, OrderAPI.ORDER_STATUS_OPEN, OrderAPI.PAYMENT_STATUS_NOTPAID, true);
    return orders;
}

/**
 * @description Orders List
 * @param {Object} processResult result
 * @param {Object} processParams params
 * @returns {void}
 */
function start(processResult, processParams) {
    var params = request.httpParameterMap;
    var orderNo = params.orderNo.stringValue;

    if (!orderNo) {
        var orders = getOrders();
        var ordersCount = orders.count;

        if (ordersCount === 0) {
            ISML.renderTemplate('sonypaymentorders/sonypaymentordersemptyui', {
                ProcessResult: processResult,
                ProcessParams: processParams
            });

            return;
        }

        var pageSize = !empty(params.pagesize.intValue) ? params.pagesize.intValue : 10;
        // eslint-disable-next-line no-shadow
        var start = params.start.intValue ? params.start.intValue : 0;
        var contentsPagingModel = new PagingModel(orders, ordersCount);
        contentsPagingModel.setPageSize(pageSize);
        contentsPagingModel.setStart(start);

        ISML.renderTemplate('sonypaymentorders/sonypaymentordersui', {
            ContentsPagingModel: contentsPagingModel,
            ProcessResult: processResult,
            ProcessParams: processParams
        });
    } else {
        try {
            var order = OrderMgr.getOrder(orderNo);
            /* eslint-disable */
            if ((order.status == OrderAPI.ORDER_STATUS_NEW || order.status == OrderAPI.ORDER_STATUS_OPEN) &&
                order.paymentStatus == OrderAPI.PAYMENT_STATUS_NOTPAID && order.custom.sonyPaymentStatusIsAuth === true) {
                ISML.renderTemplate('sonypaymentorders/findsonypaymentordersui', {
                    Order: order,
                    ProcessResult: processResult,
                    ProcessParams: processParams
                });
            } else {
                throw new Error();
            }
        } catch (e) {
            ISML.renderTemplate('sonypaymentorders/notfoundsonypaymentordersui', {
                ProcessResult: processResult,
                ProcessParams: processParams
            });
        }
        /* eslint-enable */
    }
}

/**
 * @description Action Process Capture/Cancel Order
 * @returns {void}
 */
function process() {
    var params = request.httpParameterMap;
    var processParams = {
        SelectedOrderList: params.SelectedOrderNO.stringValues,
        ActionCapture: params.capture.submitted,
        ActionCancel: params.cancel.submitted
    };
    var result = {};

    if (!empty(processParams.SelectedOrderList)) {
        if (processParams.ActionCapture) {
            result = capture(processParams);
        } else if (processParams.ActionCancel) {
            result = cancel(processParams);
        }
    }
    start(result, processParams);
}

/**
 * @description Capture Order
 * @param {Object} params params
 * @returns {Object} object
 */
function capture(params) {
    var ProcessCaptureRecord = require('~/cartridge/scripts/sony/processCaptureRecord');
    var result = ProcessCaptureRecord.execute(params);
    result.ActionComplete = true;
    return result;
}

/**
 * @description Cancel Order
 * @param {Object} params params
 * @returns {Object} object
 */
function cancel(params) {
    var ProcessCancelRecord = require('~/cartridge/scripts/sony/processCancelRecord');
    var result = ProcessCancelRecord.execute(params);
    result.ActionComplete = true;
    return result;
}

/*
 * Exposed web methods
 */
server.post('Process', csrfProtection.validateRequest, process);
server.get('Start', start);
module.exports = server.exports();
// start.public = true;
// process.public = true;

// exports.Start = start;
// exports.Process = process;
