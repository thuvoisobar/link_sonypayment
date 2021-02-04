/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable no-undef */
'use strict';

/* API Includes */
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var Resource = require('dw/web/Resource');
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');

/* Script Modules */
var SonyPaymentService = require('~/cartridge/scripts/services/sonyPaymentService');
var SCRIPT_NAME = 'sonyPaymentHelper.js';

var SonyPaymentHelper = {
    /**
     * @description  This function get and check custom preferences from BM.
     * @param {string} configKey - name of custom preferences
     * @returns {string} value of custom preferences
     */
    getConfig: function (configKey) {
        return configKey && configKey in Site.getCurrent().getPreferences().getCustom() ? Site.getCurrent().getCustomPreferenceValue(configKey) : false;
    },

    /**
     * @description  This script Card delete requests.
     * @param {CustomerPaymentInstrument} paymentToDelete payment to delete
     * @returns {void} delete card
     */
    deleteCard: function (paymentToDelete) {
        var ccUUID = paymentToDelete.UUID;
        var token = paymentToDelete.creditCardToken;

        if (this.invalidMember(token, ccUUID)) {
            this.deleteMember(token, ccUUID);
        }
        return;
    },

    /**
     * @description  This script Member information delete requests.
     * @param {string} token token
     * @param {string} ccUUID ccUUID
     * @returns {boolean} true or false
     */
    deleteMember: function (token, ccUUID) {
        try {
            var service = null;
            var sName = 'SONY.DeleteMember';
            var result = null;
            var resultObj = null;
            var kaiinId = ccUUID.substr(0, 11);

            var params = [
                'KaiinId=' + kaiinId,
                'KaiinPass=' + sonyHashData(kaiinId, customer.ID)
            ];

            service = SonyPaymentService.createDeleteMemberService();
            service.URL += '&' + params.join('&');
            result = service.call();

            if (result.ok && result.status === 'OK') {
                resultObj = parseString(result.object.text);
                // if delete a member successfully
                if (resultObj.ResponseCd.toLowerCase() === 'ok') {
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} delete a card successfully! \n{1} \n{2}', sName, getDebugInfoAndToken(token, kaiinId), JSON.stringify(resultObj));
                } else {
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: {1} \n{2} \n{3}', sName, resultObj.ResponseCd, getDebugInfoAndToken(token, kaiinId), JSON.stringify(resultObj));
                    return false;
                }
            } else {
                Logger.getLogger('SONY', 'SONY').debug('\n{0} call was failure! \n{1} \n{2}', sName, getDebugInfoAndToken(token, kaiinId), JSON.stringify(resultObj));
                return false;
            }
            return true;
        } catch (e) {
            Logger.getLogger('SONY', 'SONY').debug('\n{0} Script ERROR! \n{1} \n{2}', sName, getDebugInfoAndToken(token, kaiinId), JSON.stringify(resultObj));
            return false;
        }
    },

    /**
     * @description  This script Member information invalid requests.
     * @param {string} token token
     * @param {string} ccUUID ccUUID
     * @returns {boolean} true or false
     */
    invalidMember: function (token, ccUUID) {
        try {
            var kaiinId = ccUUID.substr(0, 11);
            var service = null;
            var sName = 'SONY.InvalidMember';
            var result = null;
            var resultObj = null;

            var params = [
                'KaiinId=' + kaiinId,
                'KaiinPass=' + sonyHashData(kaiinId, customer.ID)
            ];
            service = SonyPaymentService.createInvalidMemberService();
            service.URL += '&' + params.join('&');
            result = service.call();

            if (result.ok && result.status === 'OK') {
                resultObj = parseString(result.object.text);
                // if invalid a member successfully
                if (resultObj.ResponseCd.toLowerCase() === 'ok') {
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} invalid a card successfully! \n{1} \n{2}', sName, getDebugInfoAndToken(token, kaiinId), JSON.stringify(resultObj));
                } else {
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: {1} \n{2}', sName, resultObj.ResponseCd, getDebugInfoAndToken(token, kaiinId));
                    return false;
                }
            } else {
                Logger.getLogger('SONY', 'SONY').debug('\n{0} call was failure! \n{1}', sName, getDebugInfoAndToken(token, kaiinId));
                return false;
            }
            return true;
        } catch (e) {
            Logger.getLogger('SONY', 'SONY').debug('\n{0} Script ERROR! \n{1}', sName, getDebugInfoAndToken(token, kaiinId));
            return false;
        }
    },

    /**
     * @description  This script Member information cancel invalid requests.
     * @param {string} token token
     * @param {string} ccUUID ccUUID
     * @returns {boolean} true or false
     */
    cancelInvalidMember: function (token, ccUUID) {
        try {
            var kaiinId = ccUUID.substr(0, 11);
            var service = null;
            var sName = 'SONY.CancelInvalidMember';
            var result = null;
            var resultObj = null;

            var params = [
                'KaiinId=' + kaiinId,
                'KaiinPass=' + sonyHashData(kaiinId, customer.ID)
            ];
            service = SonyPaymentService.createCancelInvalidMemberService();
            service.URL += '&' + params.join('&');
            result = service.call();

            if (result.ok && result.status === 'OK') {
                resultObj = parseString(result.object.text);
                // if invalid a member successfully
                if (resultObj.ResponseCd.toLowerCase() === 'ok') {
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} unInvalid a card successfully! \n{1} \n{2}', sName, getDebugInfoAndToken(token, kaiinId), JSON.stringify(resultObj));
                } else {
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: {1} \n{2}', sName, resultObj.ResponseCd, getDebugInfoAndToken(token, kaiinId));
                    return false;
                }
            } else {
                Logger.getLogger('SONY', 'SONY').debug('\n{0} call was failure! \n{1}', sName, getDebugInfoAndToken(token, kaiinId));
                return false;
            }
            return true;
        } catch (e) {
            Logger.getLogger('SONY', 'SONY').debug('\n{0} Script ERROR! \n{1}', sName, getDebugInfoAndToken(token, kaiinId));
            return false;
        }
    },

    /**
     * @description  This script attempts for Master Authorization to get ProcessId, ProcessPass.
     * @param {Order} order order
     * @param {number} amount amout
     * @param {string} token token
     * @param {Object} req Request
     * @returns {boolean} true or false
     */
    masterAuthorization: function (order, amount, token, req) {
        try {
            var service = null;
            var sName = 'SONY.Authorization';
            var result = null;

            var params = [
                'MerchantFree3=' + order.orderNo,
                'PayType=01',
                'Amount=' + Math.round(amount),
                'Token=' + token
            ];

            if (req.session.privacyCache.get('sonySelectedCard')) {
                var uuid = req.session.privacyCache.get('sonySelectedCard');
                var kaiinId = uuid.substr(0, 11);
                var kaiinPass = sonyHashData(kaiinId, customer.ID);
                params = [
                    'MerchantFree3=' + order.orderNo,
                    'PayType=01',
                    'Amount=' + Math.round(amount),
                    'KaiinId=' + kaiinId,
                    'KaiinPass=' + kaiinPass
                ];
            }

            service = SonyPaymentService.createAuthorizationService();
            service.URL += '&' + params.join('&');
            result = service.call();

            if (result.ok && result.status === 'OK') {
                var resultObj = parseString(result.object.text);
                var transactionId = resultObj.TransactionId;

                var paymentInstruments = order.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD).toArray();
                var paymentInstrument = paymentInstruments[0];
                var paymentTransaction = paymentInstrument.getPaymentTransaction();
                // if authorization successfully
                if (resultObj.ResponseCd.toLowerCase() === 'ok') {
                    var processId = resultObj.ProcessId;
                    var processPass = resultObj.ProcessPass;
                    Transaction.wrap(function () {
                        order.custom.sonyProcessId = processId;
                        order.custom.sonyProcessPass = processPass;
                        order.custom.sonyPaymentStatusIsAuth = true;
                        paymentTransaction.transactionID = transactionId;
                        paymentTransaction.custom.CompanyCd = resultObj.CompanyCd;
                        if (req.session.privacyCache.get('sonySelectedCard')) {
                            // eslint-disable-next-line no-shadow
                            var uuid = req.session.privacyCache.get('sonySelectedCard');
                            // eslint-disable-next-line no-shadow
                            var kaiinId = uuid.substr(0, 11);
                            order.custom.kaiinId = kaiinId;
                        }
                    });
                    if (Site.getCurrent().getCustomPreferenceValue('sony_authorization_mode_only')) {
                        Logger.getLogger('SONY', 'SONY').debug('\n{0} authorization successfully! \n{1} \n{2} \nOrder token : {3}', sName, getOrderInfoSuccess(order), JSON.stringify(resultObj), token);
                    }
                } else {
                    req.session.privacyCache.set('sonyPaymentErrorMessage', getErrorMessage(resultObj.ResponseCd));
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: {1} \n{2} \nOrder token : {3}', sName, resultObj.ResponseCd, getFullOrderInfo(order), token);
                    return false;
                }
            } else {
                Logger.getLogger('SONY', 'SONY').debug('\n{0} call was failure! \n{1}', sName, getFullOrderInfo(order));
                return false;
            }
            return true;
        } catch (e) {
            Logger.getLogger('SONY', 'SONY').debug('\n{0} Script ERROR! \n{1}', sName, getFullOrderInfo(order));
            return false;
        }
    },

    /**
     * @description  This script attempts for Gathering Authorization and Capture to get ProcessId, ProcessPass.
     * @param {Order} order order
     * @param {number} amount amount
     * @param {string} token token
     * @param {Object} req request
     * @returns {boolean} true or false
     */
    masterGathering: function (order, amount, token, req) {
        try {
            var service = null;
            var sName = 'SONY.Gathering';
            var result = null;

            var params = [
                'MerchantFree3=' + order.orderNo,
                'PayType=01',
                'Amount=' + Math.round(amount),
                'Token=' + token
            ];

            if (req.session.privacyCache.get('sonySelectedCard')) {
                var uuid = req.session.privacyCache.get('sonySelectedCard');
                var kaiinId = uuid.substr(0, 11);
                var kaiinPass = sonyHashData(kaiinId, customer.ID);
                params = [
                    'MerchantFree3=' + order.orderNo,
                    'PayType=01',
                    'Amount=' + Math.round(amount),
                    'KaiinId=' + kaiinId,
                    'KaiinPass=' + kaiinPass
                ];
            }

            service = SonyPaymentService.createGatheringService();
            service.URL += '&' + params.join('&');
            result = service.call();

            if (result.ok && result.status === 'OK') {
                var resultObj = parseString(result.object.text);
                var transactionId = resultObj.TransactionId;

                var paymentInstruments = order.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD).toArray();
                var paymentInstrument = paymentInstruments[0];
                var paymentTransaction = paymentInstrument.getPaymentTransaction();
                // if gathering successfully
                if (resultObj.ResponseCd.toLowerCase() === 'ok') {
                    Transaction.wrap(function () {
                        order.custom.sonyProcessId = resultObj.ProcessId;
                        order.custom.sonyProcessPass = resultObj.ProcessPass;
                        order.custom.sonyPaymentStatusIsAuth = false;
                        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                        order.setExportStatus(Order.EXPORT_STATUS_READY);
                        paymentTransaction.transactionID = transactionId;
                        paymentTransaction.custom.CompanyCd = resultObj.CompanyCd;
                    });
                    if (!Site.getCurrent().getCustomPreferenceValue('sony_authorization_mode_only')) {
                        Logger.getLogger('SONY', 'SONY').debug('\n{0} authorization and capture successfully! \n{1} \n{2} \nOrder token : {3}', sName, getOrderInfoSuccess(order), JSON.stringify(resultObj), token);
                    }
                } else {
                    req.session.privacyCache.set('sonyPaymentErrorMessage', getErrorMessage(resultObj.ResponseCd));
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: {1} \n{2} \nOrder token : {3}', sName, resultObj.ResponseCd, getFullOrderInfo(order), token);
                    return false;
                }
            } else {
                Logger.getLogger('SONY', 'SONY').debug('\n{0} call was failure! \n{1}', sName, getFullOrderInfo(order));
                return false;
            }
            return true;
        } catch (e) {
            Logger.getLogger('SONY', 'SONY').debug('\n{0} Script ERROR! \n{1}', sName, getFullOrderInfo(order));
            return false;
        }
    },

    /**
     * @description   This script edit Member information requests.
     * @param {string} token token
     * @param {string} UUID uuid
     * @returns {boolean} true or false
     */
    editMemberToken: function (token, UUID) {
        try {
            var service = null;
            var sName = 'SONY.EditMemberToken';
            var result = null;
            var resultObj = null;
            var kaiinId = UUID.substr(0, 11);
            var params = [
                'KaiinId=' + kaiinId,
                'KaiinPass=' + sonyHashData(kaiinId, customer.ID),
                'Token=' + token
            ];

            service = SonyPaymentService.createEditMemberService();
            service.URL += '&' + params.join('&');
            result = service.call();

            if (result.ok && result.status === 'OK') {
                resultObj = parseString(result.object.text);
                // if add a new member successfully
                if (resultObj.ResponseCd.toLowerCase() === 'ok') {
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} edit a new card successfully! \n{1} \n{2} \nKaiinPass{3}', sName, getDebugInfo(ccNumber, kaiinId), JSON.stringify(resultObj), sonyHashData(kaiinId, customer.ID));
                } else {
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: {1} \n{2} \n{3}', sName, resultObj.ResponseCd, getDebugInfo(ccNumber, kaiinId), JSON.stringify(resultObj));
                    return false;
                }
            } else {
                Logger.getLogger('SONY', 'SONY').debug('\n{0} call was failure! \n{1} \n{2}', sName, getDebugInfo(ccNumber, kaiinId), JSON.stringify(resultObj));
                return false;
            }
            return true;
        } catch (e) {
            Logger.getLogger('SONY', 'SONY').debug('\n{0} Script ERROR! \n{1}', sName, getDebugInfo(ccNumber, kaiinId));
            return false;
        }
    },

    /**
     * @description   This script Member information registration requests.
     * @param {CustomerPaymentInstrument} customerPaymentInstrument customer payment Instrument
     * @param {string} ccNumber ccNumber
     * @param {string} token token
     * @param {Object} req request
     * @returns {boolean} true or false
     */
    newMemberToken: function (customerPaymentInstrument, ccNumber, token, req) {
        try {
            var service = null;
            var sName = 'SONY.NewMemberToken';
            var result = null;
            var resultObj = null;
            var kaiinId = customerPaymentInstrument.UUID.substr(0, 11);
            var params = [
                'KaiinId=' + kaiinId,
                'KaiinPass=' + sonyHashData(kaiinId, customer.ID),
                'Token=' + token
            ];

            service = SonyPaymentService.createNewMemberService();
            service.URL += '&' + params.join('&');
            result = service.call();

            if (result.ok && result.status === 'OK') {
                resultObj = parseString(result.object.text);
                // if add a new member successfully
                if (resultObj.ResponseCd.toLowerCase() === 'ok') {
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} add a new card successfully! \n{1} \n{2} \nKaiinPass{3} \nToken : {4}', sName, getDebugInfo(ccNumber, kaiinId), JSON.stringify(resultObj), sonyHashData(kaiinId, customer.ID), token);
                } else {
                    req.session.privacyCache.set('sonyPaymentErrorMessage', getErrorMessage(resultObj.ResponseCd));
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: {1} \n{2} \n{3}', sName, resultObj.ResponseCd, getDebugInfo(ccNumber, kaiinId), JSON.stringify(resultObj));
                    return false;
                }
            } else {
                Logger.getLogger('SONY', 'SONY').debug('\n{0} call was failure! \n{1} \n{2}', sName, getDebugInfo(ccNumber, kaiinId), JSON.stringify(resultObj));
                return false;
            }
            return true;
        } catch (e) {
            Logger.getLogger('SONY', 'SONY').debug('\n{0} Script ERROR! \n{1}', sName, getDebugInfo(ccNumber, kaiinId));
            return false;
        }
    },

    /**
     * @description  This script Process order cancel.
     * @paramInput   Order : dw.order.Order
     * @paramInput   ProcessId : String
     * @paramInput   ProcessPass : String
     * @paramOutput  TransactionId : String
     * @returns      true or false
     */
    // eslint-disable-next-line no-unused-vars
    processCancel: function (order, processId, processPass, transactionId) {
        try {
            var service = null;
            var sName = 'SONY.Cancel';
            var result = null;
            var resultObj = null;
            var params = [
                'ProcessId=' + processId,
                'ProcessPass=' + processPass,
                'MerchantFree3=' + order.orderNo
            ];

            // eslint-disable-next-line no-undef
            var requestParams = convertObjectToParams(requestDataObj);
            service = SonyPaymentService.createCancelService(requestParams);
            service.URL += '&' + params.join('&');
            result = service.call();

            if (result.ok && result.status === 'OK') {
                resultObj = parseString(result.object.text);

                // if successfully
                if (resultObj.ResponseCd.toLowerCase() === 'ok') {
                    order.setStatus(Order.ORDER_STATUS_CANCELLED);
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} cancel successfully! \n{1}', sName, getOrderInfo(order));
                } else {
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: = {1} \n{2}', sName, resultObj.ResponseCd, getOrderInfo(order));
                    return false;
                }
            } else {
                Logger.getLogger('SONY', 'SONY').debug('\n{0} call was failure! \n{1}', sName, getOrderInfo(order));
                return false;
            }
            return true;
        } catch (e) {
            Logger.getLogger('SONY', 'SONY').debug('\n{0} Script ERROR! \n{1}', sName, getOrderInfo(order));
            return false;
        }
    },

    /**
     * @description   process capture record
     * @param {Order} order order
     * @param {string} processId processId
     * @param {string} processPass processPass
     * @param {string} transactionId transactionId
     * @param {Object} req request
     * @returns {boolean} true or false
     */
    processCaptureRecord: function (order, processId, processPass, transactionId, req) {
        processId = order.custom.sonyProcessId;
        processPass = order.custom.sonyProcessPass;
        try {
            var service = null;
            var sName = 'SONY.CaptureRecord';
            var result = null;
            var resultObj = null;
            var params = [
                'ProcessId=' + order.custom.sonyProcessId,
                'ProcessPass=' + order.custom.sonyProcessPass,
                'MerchantFree3=' + order.orderNo
            ];

            if (req.session.privacyCache.get('sonySelectedCard')) {
                var uuid = req.session.privacyCache.get('sonySelectedCard');
                var kaiinId = uuid.substr(0, 11);
                var kaiinPass = sonyHashData(kaiinId, customer.ID);
                params = [
                    'ProcessId=' + order.custom.sonyProcessId,
                    'ProcessPass=' + order.custom.sonyProcessPass,
                    'MerchantFree3=' + order.orderNo,
                    'KaiinId=' + kaiinId,
                    'KaiinPass=' + kaiinPass
                ];
            }

            service = SonyPaymentService.createCaptureRecordService();
            service.URL += '&' + params.join('&');
            result = service.call();

            if (result.ok && result.status === 'OK') {
                resultObj = parseString(result.object.text);
                transactionId = resultObj.TransactionId;

                // if capture successfully
                if (resultObj.ResponseCd.toLowerCase() === 'ok') {
                    var paymentInstruments = order.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD).toArray();
                    var paymentInstrument = paymentInstruments[0];
                    var paymentTransaction = paymentInstrument.getPaymentTransaction();
                    Transaction.wrap(function () {
                        order.custom.sonyPaymentStatusIsAuth = false;
                        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                        order.setExportStatus(Order.EXPORT_STATUS_READY);
                        paymentTransaction.transactionID = transactionId;
                        paymentTransaction.custom.CompanyCd = resultObj.CompanyCd;
                    });
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} capture successfully! \n{1}', sName, getOrderInfo(order));
                } else {
                    req.session.privacyCache.set('sonyPaymentErrorMessage', getErrorMessage(resultObj.ResponseCd));
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: = {1} \n{2}', sName, resultObj.ResponseCd, getOrderInfo(order));
                    return false;
                }
            } else {
                Logger.getLogger('SONY', 'SONY').debug('\n{0} call was failure! \n{1}', sName, getOrderInfo(order));
                return false;
            }
            return true;
        } catch (e) {
            var err = e;
            Logger.getLogger('SONY', 'SONY').debug('\n{0} Script ERROR! \n{1} \n Error :{2}', sName, getOrderInfo(order), err);
            return false;
        }
    },

    /**
     * validation credit card
     * @param {Object} creditCardForm - credit card form
     * @returns {boolean} validation credit card
     */
    validationCreditCard: function (creditCardForm) {
        try {
            if (Site.getCurrent().getCustomPreferenceValue('sony_enable_card_attributes') && !creditCardForm.object.birthday.year.valid) {
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * @description
     * @param {Object} paymentInformation - the payment information
     * @returns  {boolean}   true or false
     */
    validationDate: function (paymentInformation) {
        try {
            var sonyEnableCardAttributes = Site.getCurrent().getCustomPreferenceValue('sony_enable_card_attributes');

            if (sonyEnableCardAttributes) {
                // eslint-disable-next-line radix
                var dateIsValid = isValid(parseInt(paymentInformation.birthdayDay.value), parseInt(paymentInformation.birthdayMonth.value));
                if (!dateIsValid) {
                    return false;
                }
            }
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * @param {string} token token
     * @param {string} ccUUID ccUUID
     * @returns {boolean} true or false
     */
    viewMember: function (token, ccUUID) {
        try {
            var memberInfo;
            var kaiinId = ccUUID.substr(0, 11);
            var service = null;
            var sName = 'SONY.ViewMember';
            var result = null;
            var resultObj = null;

            var params = [
                'KaiinId=' + kaiinId,
                'KaiinPass=' + sonyHashData(kaiinId, customer.ID)
            ];

            service = SonyPaymentService.createViewMemberService();
            service.URL += '&' + params.join('&');
            result = service.call();

            if (result.ok && result.status === 'OK') {
                resultObj = parseString(result.object.text);

                // if add a new member successfully
                if (resultObj.ResponseCd.toLowerCase() === 'ok') {
                    memberInfo = resultObj;
                    Logger.getLogger('SONY', 'SONY').debug('\n{0} view member successfully! \n{1} \n{2}', sName, getDebugInfoAndToken(token, kaiinId), JSON.stringify(resultObj));
                    return memberInfo;
                }
                Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: {1} \n{2}', sName, resultObj.ResponseCd, getDebugInfoAndToken(token, kaiinId));
                return false;
            }
            Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: {1} \n{2}', sName, resultObj.ResponseCd, getDebugInfoAndToken(token, kaiinId));
            return false;
        } catch (e) {
            Logger.getLogger('SONY', 'SONY').debug('\n{0} have an NG response! \nError codes: {1} \n{2}', sName, resultObj.ResponseCd, getDebugInfoAndToken(token, kaiinId));
            return false;
        }
    },

    /**
     * @description view member by Token
     * @param {string} token token
     * @returns  {boolean} true or false
     */
    viewMemberByToken: function (token) {
        try {
            var result = null;
            var resultObj = null;

            var params = [
                'Token=' + token
            ];

            var service = SonyPaymentService.createViewMemberByTokenService();
            service.URL += '&' + params.join('&');
            result = service.call();

            if (result.ok && result.status === 'OK') {
                resultObj = parseString(result.object.text);

                // if add a new member successfully
                if (resultObj.ResponseCd.toLowerCase() === 'ok') {
                    return resultObj;
                }
                return false;
            }
            return false;
        } catch (e) {
            return false;
        }
    },

    sonyHashData: function (data, key) {
        sonyHashData(data, key);
    }
};

/**
 * @description  parseString
 * @param {string} str - string to parse
 * @returns {Object} object
 */
function parseString(str) {
    var resultArr = str.split('&');
    var resultObj = {};
    var eArr = null;

    for each(var e in resultArr) {
        eArr = e.split('=');
        resultObj[eArr[0]] = eArr[1];
    }

    return resultObj;
}

/**
 * @description sonyHashDatad
 * @param {Object} data data
 * @param {string} key key
 * @returns {string} - string
 */
function sonyHashData(data, key) {
    var result = null;
    try {
        var hmac = new dw.crypto.Mac(dw.crypto.Mac.HMAC_MD5);
        var mvalue = hmac.digest(data, key);
        result = dw.crypto.Encoding.toHex(mvalue);
    } catch (e) {
        Logger.getLogger('paymentOperator').error('Function SonyHashData throws exception! {0}', e.message);
    }
    return result.substr(0, 11);
}

/**
 * @description this function return number of days in Month(1-12)
 * @param {number} m month
 * @param {number} y year
 * @returns {number} number of days
 */
function daysInMonth(m, y) {
    switch (m) {
        case 2 :
            return (y % 4 === 0 && y % 100) || y % 400 === 0 ? 29 : 28;
        case 4 : case 6 : case 9 : case 11 :
            return 30;
        default :
            return 31;
    }
}

/**
 * Check valid date
 * @param {number} d date
 * @param {number} m month
 * @param {number} y year
 * @returns {boolean} boolean
 */
function isValid(d, m, y) {
    return m >= 0 && m <= 12 && d > 0 && d <= daysInMonth(m, y);
}

/**
 * @description  show info debug
 * @param {number} ccNumber ccnumber
 * @param {number}  kaiinId kaiinId
 * @returns {string} string
 */
function getDebugInfo(ccNumber, kaiinId) {
    return 'Card No = ' + '************' + ccNumber.substr(ccNumber.length - 4, 4) + ', Member Id = ' + kaiinId;
}

/**
 * @description  show info debug and token
 * @param {string} token token
 * @param {string} kaiinId kaiinId
 * @returns {string} string
 */
function getDebugInfoAndToken(token, kaiinId) {
    return 'Member Id = ' + kaiinId + (!empty(token) ? ', Token = ' + token : '');
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
 * @description  show full info of order
 * @param {Order} order order
 * @returns {string} string
 */
function getFullOrderInfo(order) {
    return 'Order No = ' + order.orderNo + ', order status = FAILED, payment status = ' + order.paymentStatus.displayValue;
}

/**
 * @description  show info of success order
 * @param {Order} order order
 * @returns {string} string
 */
function getOrderInfoSuccess(order) {
    return 'Order No = ' + order.orderNo + ', order status = NEW, payment status = ' + order.paymentStatus.displayValue;
}

/**
 * Convert object to form encoded parameter
 * @param {Object} requestDataObj object
 * @returns {string} form encoded parameter string
 */
function convertObjectToParams(requestDataObj) {
    var params = '';
    Object.keys(requestDataObj).forEach(function (key) {
        params += '&' + key + '=' + requestDataObj[key];
    });
    return params.substr(1);
}

/**
 * Convert form encoded parameter to object
 * @param {string} params encoded parameter string
 * @returns {Object} output object
 */
function convertParamsToObject(params) {
    var paramArr = params.split('&');
    var returnObj = {};
    for (var i in paramArr) {
        var split = paramArr[i].split('=');
        returnObj[split[0]] = split[1] + (split[2] ? ('=' + split[2]) : '');
    }
    return returnObj;
}

/**
 * Get Error Message from Sony Payment
 *
 * @param {string} responseCodes object
 * @returns {string} form encoded parameter string
 */
function getErrorMessage(responseCodes) {
    var errorMessage = '';
    var errorCodes = responseCodes.split('|');
    for (var i = 0; i < errorCodes.length; i++) {
        errorMessage += Resource.msg('error.msg.' + errorCodes[i], 'checkout', null);
    }
    return errorMessage;
}

/**
 * Complete order after successful payment, for credit car payment
 * @param {string} orderNo number
 * @param {Object} verifyData id from payment gateway
 * @param {Object} req request
 * @returns {void} finalize order
 */
function finalizeOrder(orderNo, verifyData, req) {
    var currentOrder = OrderMgr.getOrder(orderNo);
    if (currentOrder && currentOrder.status.value === Order.ORDER_STATUS_CREATED) {
        try {
            Transaction.wrap(function () {
                currentOrder.custom.sonyProcessId = verifyData.ProcessId;
                currentOrder.custom.sonyProcessPass = verifyData.ProcessPass;
                currentOrder.custom.sonyPaymentStatusIsAuth = true;
                currentOrder.custom.secureResponse = JSON.stringify(verifyData);

                if (req.session.privacyCache.get('sonySelectedCard')) {
                    var uuid = req.session.privacyCache.get('sonySelectedCard');
                    var kaiinId = uuid.substr(0, 11);
                    currentOrder.custom.kaiinId = kaiinId;
                }

                if (!Site.getCurrent().getCustomPreferenceValue('sony_authorization_mode_only')) {
                    currentOrder.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                    currentOrder.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    currentOrder.setExportStatus(Order.EXPORT_STATUS_READY);
                    currentOrder.custom.sonyPaymentStatusIsAuth = false;
                }

                if (currentOrder.getPaymentInstruments()) {
                    var paymentInstrument = currentOrder.getPaymentInstruments()[0];
                    var paymentTransaction = paymentInstrument.getPaymentTransaction();
                    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
                    paymentTransaction.transactionID = verifyData.TransactionId;
                    paymentTransaction.custom.CompanyCd = verifyData.CompanyCd;
                    paymentTransaction.paymentProcessor = paymentProcessor;
                }
            });
        } catch (error) {
            Logger.getLogger('SONY', 'SONY').error('\n{0} Error while finalizing order. Order: {1} {2}', SCRIPT_NAME, orderNo, error.message);
        }
    }
}

/**
 * Fail order after unsuccessful payment
 * @param {string} orderNo number
 * @param {Object} verifyData verifyData
 * @returns {void} fail order
 */
function failOrder(orderNo, verifyData) {
    var currentOrder = OrderMgr.getOrder(orderNo);
    if (currentOrder && currentOrder.status.value === Order.ORDER_STATUS_CREATED) {
        try {
            Transaction.wrap(function () {
                currentOrder.custom.secureResponse = JSON.stringify(verifyData);
                if (currentOrder.getPaymentInstruments()) {
                    var paymentInstrument = currentOrder.getPaymentInstruments()[0];
                    var paymentTransaction = paymentInstrument.getPaymentTransaction();
                    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
                    paymentTransaction.transactionID = verifyData.TransactionId;
                    paymentTransaction.paymentProcessor = paymentProcessor;
                }
                OrderMgr.failOrder(currentOrder, true);
            });
        } catch (error) {
            Logger.getLogger('SONY', 'SONY').error('\n{0} Error while set fail order. Order: {1} {2}', SCRIPT_NAME, orderNo, error.message);
        }
    }
}

/**
 * @description Get ProcNo
 * @returns {string} date
 */
function getProcNo() {
    var calendar = new Calendar();
    var hours = Site.current.getTimezoneOffset() / 3600000;
    calendar.add(Calendar.HOUR, hours);
    return StringUtils.formatCalendar(calendar, 'hhmmsss');
}

/**
 * exports modules
 */
module.exports = SonyPaymentHelper;
module.exports.getErrorMessage = getErrorMessage;
module.exports.convertParamsToObject = convertParamsToObject;
module.exports.finalizeOrder = finalizeOrder;
module.exports.failOrder = failOrder;
module.exports.sonyHashData = sonyHashData;
module.exports.getProcNo = getProcNo;
