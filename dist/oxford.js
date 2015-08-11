'use strict';

var face = require('./face.js'),
    vision = require('./vision.js'),
    oxford = {};

oxford.Client = function (key) {
    if (!key || key === '') {
        return console.error('Tried to initialize Project Oxford client without API key');
    }

    this._key = key;
    this.face = face(key);
    this.vision = vision(key);
};

module.exports = oxford;
