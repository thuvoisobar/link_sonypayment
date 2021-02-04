/* eslint-disable no-unused-vars */
'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
/**
 * Create alter transaction service
 *
 * @param {string} requestParams parameter
 * @returns {dw.svc.LocalServiceRegistry} service object
 */
function createAuthorizationService(requestParams) {
    return LocalServiceRegistry.createService('SONY.Authorization', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setRequestMethod('POST');
            svc.URL += '&MerchantId=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantID') +
                    '&MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW') +
                    '&MerchantFree1=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') +
                    '&MerchantFree2=' + (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') ? (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) : '') +
                    '&TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode') +
                    '&TransactionDate=' + transactionDate();
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, params) {
            var response = 'TransactionId=1000000000123' +
                    '&TransactionDate=20090101' +
                    '&OperateId=1Auth' +
                    '&ProcessId=abcdd12345678ABCDEFG123456789abc' +
                    '&ProcessPass=12345678abcdefghi9876543210ABCDE' +
                    '&ResponseCd=OK' +
                    '&CompanyCd=Y2' +
                    '&ApproveNo=1234567';
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: response
            };
        },
        getRequestLogMessage: function (reqObj) {
            return JSON.stringify(reqObj);
        },
        getResponseLogMessage: function (respObj) {
            return JSON.stringify(respObj.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
}

/**
 * Create Gathering transaction service
 *
 * @param {string} requestParams parameter
 * @returns {dw.svc.LocalServiceRegistry} service object
 */
function createGatheringService(requestParams) {
    return LocalServiceRegistry.createService('SONY.Gathering', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setRequestMethod('POST');
            svc.URL += '&MerchantId=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantID') +
                    '&MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW') +
                    '&MerchantFree1=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') +
                    '&MerchantFree2=' + (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') ? (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) : '') +
                    '&TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode') +
                    '&TransactionDate=' + transactionDate();
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, params) {
            var response = 'TransactionId=1000000000123' +
                    '&TransactionDate=20090101' +
                    '&OperateId=1Gathering' +
                    '&ProcessId=abcdd12345678ABCDEFG123456789abc' +
                    '&ProcessPass=12345678abcdefghi9876543210ABCDE' +
                    '&ResponseCd=OK' +
                    '&CompanyCd=Y2' +
                    '&ApproveNo=1234567';
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: response
            };
        },
        getRequestLogMessage: function (reqObj) {
            return JSON.stringify(reqObj);
        },
        getResponseLogMessage: function (respObj) {
            return JSON.stringify(respObj.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
}

/**
 * Create cancel transaction service
 *
 * @param {string} requestParams parameter
 * @returns {dw.svc.LocalServiceRegistry} service object
 */
function createCancelService(requestParams) {
    return LocalServiceRegistry.createService('SONY.Cancel', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setRequestMethod('POST');
            svc.URL += '&MerchantId=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantID') +
                    '&MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW') +
                    '&MerchantFree1=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') +
                    '&MerchantFree2=' + (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') ? (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) : '') +
                    '&TransactionDate=' + transactionDate();
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, params) {
            var response = 'TransactionId=1000000000345' +
                    '&TransactionDate=20090101' +
                    '&OperateId=1Delete' +
                    '&ProcessId=abcdd12345678ABCDEFG123456789abc' +
                    '&ProcessPass=12345678abcdefghi9876543210ABCDE' +
                    '&ResponseCd=OK' +
                    '&CompanyCd=Y2' +
                    '&ApproveNo=1234567';
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: response
            };
        },
        getRequestLogMessage: function (reqObj) {
            return JSON.stringify(reqObj);
        },
        getResponseLogMessage: function (respObj) {
            return JSON.stringify(respObj.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
}

/**
 * Create capture transaction service
 *
 * @param {string} requestParams parameter
 * @returns {dw.svc.LocalServiceRegistry} service object
 */
function createCaptureRecordService(requestParams) {
    return LocalServiceRegistry.createService('SONY.CaptureRecord', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setRequestMethod('POST');
            svc.URL += '&MerchantId=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantID') +
                    '&MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW') +
                    '&MerchantFree1=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') +
                    '&MerchantFree2=' + (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') ? (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) : '') +
                    '&TransactionDate=' + transactionDate() +
                    '&SalesDate=' + transactionDate();
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, params) {
            var response = 'TransactionId=1000000000234' +
                    '&TransactionDate=20090101' +
                    '&OperateId=1Capture' +
                    '&ProcessId=abcdd12345678ABCDEFG123456789abc' +
                    '&ProcessPass=12345678abcdefghi9876543210ABCDE' +
                    '&ResponseCd=OK' +
                    '&CompanyCd=Y2';
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: response
            };
        },
        getRequestLogMessage: function (reqObj) {
            return JSON.stringify(reqObj);
        },
        getResponseLogMessage: function (respObj) {
            return JSON.stringify(respObj.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
}

/**
 * Create card check transaction service
 *
 * @param {string} requestParams parameter
 * @returns {dw.svc.LocalServiceRegistry} service object
 */
function createCardCheckService(requestParams) {
    return LocalServiceRegistry.createService('SONY.CardCheck', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setRequestMethod('POST');
            svc.URL += '&MerchantId=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantID') +
                    '&MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW') +
                    '&MerchantFree1=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') +
                    '&MerchantFree2=' + (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') ? (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) : '') +
                    '&TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode') +
                    '&TransactionDate=' + transactionDate();
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, params) {
            var response = 'TransactionId=1000000000123' +
                    '&TransactionDate=20090101' +
                    '&OperateId=1Check' +
                    '&ProcessId=abcdd12345678ABCDEFG123456789abc' +
                    '&ProcessPass=12345678abcdefghi9876543210ABCDE' +
                    '&ResponseCd=OK' +
                    '&CompanyCd=Y2' +
                    '&ApproveNo=1234567';
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: response
            };
        },
        getRequestLogMessage: function (reqObj) {
            return JSON.stringify(reqObj);
        },
        getResponseLogMessage: function (respObj) {
            return JSON.stringify(respObj.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
}

/**
 * Create delete member information transaction service
 *
 * @param {string} requestParams parameter
 * @returns {dw.svc.LocalServiceRegistry} service object
 */
function createDeleteMemberService(requestParams) {
    return LocalServiceRegistry.createService('SONY.DeleteMember', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setRequestMethod('POST');
            svc.URL += '&MerchantId=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantID') +
                    '&MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW') +
                    '&MerchantFree1=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') +
                    '&MerchantFree2=' + (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') ? (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) : '') +
                    '&TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode') +
                    '&TransactionDate=' + transactionDate();
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, params) {
            var response = 'TransactionId=000000000123' +
                    '&TransactionDate=20090101' +
                    '&OperateId=4MemDel' +
                    '&ResponseCd=OK';
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: response
            };
        },
        getRequestLogMessage: function (reqObj) {
            return JSON.stringify(reqObj);
        },
        getResponseLogMessage: function (respObj) {
            return JSON.stringify(respObj.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
}

/**
 * Create invalid member transaction service
 *
 * @param {string} requestParams parameter
 * @returns {dw.svc.LocalServiceRegistry} service object
 */
function createInvalidMemberService(requestParams) {
    return LocalServiceRegistry.createService('SONY.InvalidMember', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setRequestMethod('POST');
            svc.URL += '&MerchantId=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantID') +
                    '&MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW') +
                    '&MerchantFree1=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') +
                    '&MerchantFree2=' + (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') ? (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) : '') +
                    '&TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode') +
                    '&TransactionDate=' + transactionDate();
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, params) {
            var response = 'TransactionId=000000000123' +
                    '&TransactionDate=20090101' +
                    '&OperateId=4MemInval' +
                    '&ResponseCd=OK';
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: response
            };
        },
        getRequestLogMessage: function (reqObj) {
            return JSON.stringify(reqObj);
        },
        getResponseLogMessage: function (respObj) {
            return JSON.stringify(respObj.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
}

/**
 * Create cancel invalid member transaction service
 *
 * @param {string} requestParams parameter
 * @returns {dw.svc.LocalServiceRegistry} service object
 */
function createCancelInvalidMemberService(requestParams) {
    return LocalServiceRegistry.createService('SONY.CancelInvalidMember', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setRequestMethod('POST');
            svc.URL += '&MerchantId=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantID') +
                    '&MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW') +
                    '&MerchantFree1=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') +
                    '&MerchantFree2=' + (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') ? (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) : '') +
                    '&TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode') +
                    '&TransactionDate=' + transactionDate();
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, params) {
            var response = 'TransactionId=000000000123' +
                    '&TransactionDate=20090101' +
                    '&OperateId=4MemUnInval' +
                    '&ResponseCd=OK';
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: response
            };
        },
        getRequestLogMessage: function (reqObj) {
            return JSON.stringify(reqObj);
        },
        getResponseLogMessage: function (respObj) {
            return JSON.stringify(respObj.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
}

/**
 * Create new mebmer transaction service
 *
 * @param {string} requestParams parameter
 * @returns {dw.svc.LocalServiceRegistry} service object
 */
function createNewMemberService(requestParams) {
    return LocalServiceRegistry.createService('SONY.NewMember', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setRequestMethod('POST');
            svc.URL += '&MerchantId=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantID') +
                    '&MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW') +
                    '&MerchantFree1=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') +
                    '&MerchantFree2=' + (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') ? (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) : '') +
                    '&TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode') +
                    '&TransactionDate=' + transactionDate();
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, params) {
            var response = 'TransactionId=000000000123' +
                    '&TransactionDate=20090101' +
                    '&OperateId=4MemAdd' +
                    '&ResponseCd=OK' +
                    '&CompanyCd=ab';
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: response
            };
        },
        getRequestLogMessage: function (reqObj) {
            return JSON.stringify(reqObj);
        },
        getResponseLogMessage: function (respObj) {
            return JSON.stringify(respObj.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
}

/**
 * Create edit member transaction service
 *
 * @param {string} requestParams parameter
 * @returns {dw.svc.LocalServiceRegistry} service object
 */
function createEditMemberService(requestParams) {
    return LocalServiceRegistry.createService('SONY.EditMember', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setRequestMethod('POST');
            svc.URL += '&MerchantId=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantID') +
                    '&MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW') +
                    '&MerchantFree1=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') +
                    '&MerchantFree2=' + (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') ? (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) : '') +
                    '&TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode') +
                    '&TransactionDate=' + transactionDate();
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, params) {
            var response = 'TransactionId=000000000123' +
                    '&TransactionDate=20090101' +
                    '&OperateId=4MemChg' +
                    '&ResponseCd=OK' +
                    '&CompanyCd=ab';
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: response
            };
        },
        getRequestLogMessage: function (reqObj) {
            return JSON.stringify(reqObj);
        },
        getResponseLogMessage: function (respObj) {
            return JSON.stringify(respObj.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
}

/**
 * Create alter transaction service
 *
 * @param {string} requestParams parameter
 * @returns {dw.svc.LocalServiceRegistry} service object
 */
function createViewMemberService(requestParams) {
    return LocalServiceRegistry.createService('SONY.ViewMember', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setRequestMethod('POST');
            svc.URL += '&MerchantId=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantID') +
                    '&MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW') +
                    '&MerchantFree1=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') +
                    '&MerchantFree2=' + (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') ? (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) : '') +
                    '&TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode') +
                    '&TransactionDate=' + transactionDate();
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, params) {
            var response = 'TransactionId=000000000123' +
                    '&TransactionDate=20090101' +
                    '&OperateId=4MemRef' +
                    '&ResponseCd=OK' +
                    '&CardNo=4111111111111111' +
                    '&CardExp=2205' +
                    '&CompanyCd=ab' +
                    '&KaiinStatus=0' +
                    '&KaiinEnableDate=20110101';
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: response
            };
        },
        getRequestLogMessage: function (reqObj) {
            return JSON.stringify(reqObj);
        },
        getResponseLogMessage: function (respObj) {
            return JSON.stringify(respObj.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
}

/**
 * Create view member token transaction service
 *
 * @param {string} requestParams parameter
 * @returns {dw.svc.LocalServiceRegistry} service object
 */
function createViewMemberByTokenService(requestParams) {
    return LocalServiceRegistry.createService('SONY.ViewMemberByToken', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setRequestMethod('POST');
            svc.URL += '&MerchantId=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantID') +
                    '&MerchantPass=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantPW') +
                    '&MerchantFree1=' + Site.getCurrent().getCustomPreferenceValue('sony_merchantFree') +
                    '&MerchantFree2=' + (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2') ? (Site.getCurrent().getCustomPreferenceValue('sony_merchantFree2')) : '') +
                    '&TenantId=' + Site.getCurrent().getCustomPreferenceValue('sony_storeCode') +
                    '&TransactionDate=' + transactionDate();
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, params) {
            var response = 'TransactionId=000000000123' +
                    '&TransactionDate=20090101' +
                    '&OperateId=4MemRef' +
                    '&ResponseCd=OK' +
                    '&CardNo=12345678910' +
                    '&CarExp=1305' +
                    '&CompanyCd=ab' +
                    '&KaiinStatus=0' +
                    '&KaiinEnableDate=20110101';
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: response
            };
        },
        getRequestLogMessage: function (reqObj) {
            return JSON.stringify(reqObj);
        },
        getResponseLogMessage: function (respObj) {
            return JSON.stringify(respObj.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
}

/**
 * @description Get Transaction Date
 * @returns {string} format calendar
 */
function transactionDate() {
    var calendar = new Calendar();
    var hours = Site.current.getTimezoneOffset() / 3600000;
    calendar.add(Calendar.HOUR, hours);
    return StringUtils.formatCalendar(calendar, 'yyyyMMdd');
}

/**
 * exports module
 **/

module.exports.createAuthorizationService = createAuthorizationService;
module.exports.createCancelService = createCancelService;
module.exports.createCaptureRecordService = createCaptureRecordService;
module.exports.createCardCheckService = createCardCheckService;
module.exports.createDeleteMemberService = createDeleteMemberService;
module.exports.createInvalidMemberService = createInvalidMemberService;
module.exports.createCancelInvalidMemberService = createCancelInvalidMemberService;
module.exports.createNewMemberService = createNewMemberService;
module.exports.createEditMemberService = createEditMemberService;
module.exports.createViewMemberService = createViewMemberService;
module.exports.createViewMemberByTokenService = createViewMemberByTokenService;
module.exports.createGatheringService = createGatheringService;
