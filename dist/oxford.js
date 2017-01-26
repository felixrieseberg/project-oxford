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
 * Creates a new Project Oxford Client using a given API key.
 * @class Client
 * @param {string} key  - Project Oxford API Key
 * @param {string} host - Optional host address
 */
oxford.Client = function (key, host) {
    if (!key || key === '') {
        return console.error('Tried to initialize Project Oxford client without API key');
    }

    var bingHost = (host || 'https://api.cognitive.microsoft.com').replace('\/$', '');
    host = (host || 'https://westus.api.cognitive.microsoft.com').replace('\/$', '');

    this._key = key;
    this.emotion = emotion(key, host);
    this.face = face(key, host);
    this.text = text(key, bingHost);
    this.video = video(key, host);
    this.vision = vision(key, host);
    this.weblm = weblm(key, host);
};

module.exports = oxford;
