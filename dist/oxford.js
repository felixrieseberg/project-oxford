'use strict';

var face = require('./face.js'),
    vision = require('./vision.js'),
    oxford = {};

/**
 * Creates a new Project Oxford Client using a given API key.
 * @class Client
 * @param {string} key - Project Oxford API Key
 */
oxford.Client = function (key) {
    if (!key || key === '') {
        return console.error('Tried to initialize Project Oxford client without API key');
    }

    this._key = key;
    this.face = face(key);
    this.vision = vision(key);
};

module.exports = oxford;
