'use strict';

var emotion = require('./emotion.js'),
    face = require('./face.js'),
    text = require('./text.js'),
    video = require('./video.js'),
    vision = require('./vision.js'),
    weblm = require('./weblm.js'),
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
    this.emotion = emotion(key);
    this.face = face(key);
    this.text = text(key);
    this.video = video(key);
    this.vision = vision(key);
    this.weblm = weblm(key);
};

module.exports = oxford;
