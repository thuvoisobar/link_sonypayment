'use strict';

/* API Includes */
var Site = require('dw/system/Site');
var Encoding = require('dw/crypto/Encoding');
var Cipher = require('dw/crypto/Cipher');
var Bytes = require('dw/util/Bytes');

/**
 AES Encoding/Decoding
*/

var key = Site.getCurrent().getCustomPreferenceValue('AESSecretKey');
var vector = Site.getCurrent().getCustomPreferenceValue('AESVector');
var encodedSalt = Encoding.toBase64(new Bytes(vector, 'UTF8'));
var encodedKey = Encoding.toBase64(new Bytes(key, 'UTF8'));

var AESHelper = {

    encode: function (stringToEncrypt) {
        if (stringToEncrypt) {
            return new Cipher().encrypt(stringToEncrypt, encodedKey, 'AES/CBC/PKCS5Padding', encodedSalt, 0);
        }
        return stringToEncrypt;
    },

    decode: function (stringToDecrypt) {
        if (stringToDecrypt) {
            return new dw.crypto.Cipher().decrypt(stringToDecrypt, encodedKey, 'AES/CBC/PKCS5Padding', encodedSalt, 0);
        }
        return stringToDecrypt;
    }
};

module.exports = AESHelper;
