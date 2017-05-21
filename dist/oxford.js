'use strict';

var emotion = require('./emotion.js'),
    face = require('./face.js'),
    text = require('./text.js'),
    video = require('./video.js'),
    vision = require('./vision.js'),
    weblm = require('./weblm.js'),
    oxford = {};

oxford.makeBuffer = function (dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) === -1) {
        throw new Error('non-base64-encoded data URIs are not currently supported');
    } else {
        var parts = dataURL.split(BASE64_MARKER);
        return new Buffer(parts[1], 'base64');
    }
};

/**
 * Regions hosting Microsoft Cognitive Services APIs.
 */
oxford.region = {
    EAST_US_2: 'eastus2',
    FREE_TRIAL: 'westcentralus',
    SOUTHEAST_ASIA: 'southeastasia',
    WEST_CENTRAL_US: 'westcentralus',
    WEST_EUROPE: 'westeurope',
    WEST_US: 'westus'
};

/**
 * Construct a service host name from a region enum.
 * @param {object} region - An oxford.region enumerated value
 */
oxford.hostFromRegion = function (region) {
    return 'https://' + region + '.api.cognitive.microsoft.com';
};

/**
 * Creates a new Project Oxford Client using a given API key.
 * @class Client
 * @param {string} key  - Project Oxford API Key
 * @param {string} hostOrRegion - Optional host address or region
 */
oxford.Client = function (key, hostOrRegion) {
    if (!key || key === '') {
        return console.error('Tried to initialize Project Oxford client without API key');
    }

    var bingHost = (hostOrRegion || 'https://api.cognitive.microsoft.com').replace('\/$', '');

    // If hostOrRegion is a simple string, assume it's a region, otherwise treat it as a host.
    // If hostOrRegion is not defined, use westus for the region, for backwards compatibility.
    var host;
    if (hostOrRegion) {
        var re = /[a-z]\w+/;
        host = hostOrRegion.match(re) ? oxford.hostFromRegion(hostOrRegion) : hostOrRegion.replace('\/$', '');
    } else {
        host = oxford.hostFromRegion(oxford.region.WEST_US);
    }

    this._key = key;
    this.emotion = emotion(key, host);
    this.face = face(key, host);
    this.text = text(key, bingHost);
    this.video = video(key, host);
    this.vision = vision(key, host);
    this.weblm = weblm(key, host);
};

module.exports = oxford;
