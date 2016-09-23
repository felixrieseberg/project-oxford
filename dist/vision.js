'use strict';

var request = require('request').defaults({
    headers: { 'User-Agent': 'nodejs/0.4.0' } }),
    fs = require('fs'),
    _Promise = require('bluebird');

var rootPath = '/vision/v1.0';
var analyzeUrl = '/analyze';
var thumbnailUrl = '/generateThumbnail';
var ocrUrl = '/ocr';
var modelsUrl = '/models';

/**
 * @namespace
 * @memberof Client
 */
var vision = function vision(key, host) {
    /**
     * @private
     */
    function _return(error, response, resolve, reject) {
        if (error) {
            return reject(error);
        }

        if (response.statusCode !== 200) {
            reject(response.body);
        }

        return resolve(response.body);
    }

    /**
     * (Private) Analyze a local image, using a fs pipe
     * @private
     * @param  {string} url         - API url
     * @param  {string} image       - Path to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _postLocal(url, image, options) {
        return new _Promise(function (resolve, reject) {
            fs.createReadStream(image).pipe(request.post({
                uri: host + rootPath + url,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/octet-stream'
                },
                qs: options
            }, function (error, response) {
                response.body = JSON.parse(response.body);
                _return(error, response, resolve, reject);
            }));
        });
    }

    /**
     * (Private) Analyze an online image
     * @private
     * @param  {string} url         - API url
     * @param  {string} image       - Url to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _postOnline(url, image, options) {
        return new _Promise(function (resolve, reject) {
            request.post({
                uri: host + rootPath + url,
                headers: { 'Ocp-Apim-Subscription-Key': key },
                json: true,
                body: { url: image },
                qs: options
            }, function (error, response) {
                return _return(error, response, resolve, reject);
            });
        });
    }

    /**
     * This operation does a deep analysis on the given image and then extracts a
     * set of rich visual features based on the image content.
     *
     * @param  {Object}  options                - Options object describing features to extract
     * @param  {string}  options.url            - Url to image to be analyzed
     * @param  {string}  options.path           - Path to image to be analyzed
     * @param  {boolean} options.ImageType      - Detects if image is clipart or a line drawing.
     * @param  {boolean} options.Color          - Determines the accent color, dominant color, if image is black&white.
     * @param  {boolean} options.Faces          - Detects if faces are present. If present, generate coordinates, gender and age.
     * @param  {boolean} options.Adult          - Detects if image is pornographic in nature (nudity or sex act). Sexually suggestive content is also detected.
     * @param  {boolean} options.Categories     - Image categorization; taxonomy defined in documentation.
     * @param  {boolean} options.Tags           - Tags the image with a detailed list of words related to the image content.
     * @param  {boolean} options.Description    - Describes the image content with a complete English sentence.
     * @return {Promise}                        - Promise resolving with the resulting JSON
     */
    function analyzeImage(options) {
        var test = /(ImageType)|(Color)|(Faces)|(Adult)|(Categories)|(Tags)|(Description)/;
        var query = [];

        for (var key in options) {
            if (test.test(key) && options[key]) {
                query.push(key);
            }
        }

        var qs = { visualFeatures: query.join() };

        if (options.path) {
            return _postLocal(analyzeUrl, options.path, qs);
        }
        if (options.url) {
            return _postOnline(analyzeUrl, options.url, qs);
        }
    }

    /**
     * (Private) Get a thumbnail for a local image, using a fs pipe
     * @private
     * @param  {string} image       - Path to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _thumbnailLocal(image, options, pipe) {
        return new _Promise(function (resolve, reject) {
            fs.createReadStream(image).pipe(request.post({
                uri: host + rootPath + thumbnailUrl,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/octet-stream'
                },
                qs: options
            }, function (error, response) {
                _return(error, response, resolve, reject);
            })).pipe(pipe);
        });
    }

    /**
     * (Private) Get a thumbnail for am online image
     * @private
     * @param  {string} image       - url to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _thumbnailOnline(image, options, pipe) {
        return new _Promise(function (resolve, reject) {
            request.post({
                uri: host + rootPath + thumbnailUrl,
                headers: { 'Ocp-Apim-Subscription-Key': key },
                json: true,
                body: { url: image },
                qs: options
            }, function (error, response) {
                return _return(error, response, resolve, reject);
            }).pipe(pipe);
        });
    }

    /**
     * Generate a thumbnail image to the user-specified width and height. By default, the
     * service analyzes the image, identifies the region of interest (ROI), and generates
     * smart crop coordinates based on the ROI. Smart cropping is designed to help when you
     * specify an aspect ratio that differs from the input image.
     *
     * @param  {Object}  options                - Options object describing features to extract
     * @param  {string}  options.url            - Url to image to be thumbnailed
     * @param  {string}  options.path           - Path to image to be thumbnailed
     * @param  {number}  options.width          - Width of the thumb in pixels
     * @param  {number}  options.height         - Height of the thumb in pixels
     * @param  {boolean} options.smartCropping  - Should SmartCropping be enabled?
     * @param  {Object}  options.pipe           - We'll pipe the returned image to this object
     * @return {Promise}                        - Promise resolving with the resulting JSON
     */
    function thumbnail(options) {
        var qs = {
            width: options.width ? options.width : 50,
            height: options.height ? options.height : 50,
            smartCropping: options.smartCropping ? options.smartCropping : false
        };

        if (options.path) {
            return _thumbnailLocal(options.path, qs, options.pipe);
        }
        if (options.url) {
            return _thumbnailOnline(options.url, qs, options.pipe);
        }
    }

    /**
     * Optical Character Recognition (OCR) detects text in an image and extracts the recognized
     * characters into a machine-usable character stream.
     *
     * @param  {Object}  options                    - Options object describing features to extract
     * @param  {string}  options.url                - Url to image to be analyzed
     * @param  {string}  options.path               - Path to image to be analyzed
     * @param  {string}  options.language           - BCP-47 language code of the text to be detected in the image. Default value is "unk", then the service will auto detect the language of the text in the image.
     * @param  {string}  options.detectOrientation  - Detect orientation of text in the image
     * @return {Promise}                            - Promise resolving with the resulting JSON
     */
    function ocr(options) {
        var qs = {
            language: options.language ? options.language : 'unk',
            detectOrientation: options.detectOrientation ? options.detectOrientation : true
        };

        if (options.path) {
            return _postLocal(ocrUrl, options.path, qs);
        }
        if (options.url) {
            return _postOnline(ocrUrl, options.url, qs);
        }
    }

    /**
     * @namespace
     * @memberof Client.vision
     */
    var models = {
        /**
         * Lists the domain-specific image analysis models.
         * @return {Promise} - Promise resolving with the resulting JSON
         */
        list: function list() {
            return new _Promise(function (resolve, reject) {
                request({
                    uri: host + rootPath + modelsUrl,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
                    response.body = JSON.parse(response.body);
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Analyze an image using a domain-specific image classifier.
         *
         * @param  {string} model              - Name of the model
         * @param  {Object} options            - Options object location of the source image
         * @param  {string} options.url        - Url to image to be analyzed
         * @param  {string} options.path       - Path to image to be analyzed
         * @return {Promise}                   - Promise resolving with the resulting JSON
         */
        analyzeImage: function analyzeImage(model, options) {
            var modelUrl = modelsUrl + '/' + model + '/analyze';

            if (options.path) {
                return _postLocal(modelUrl, options.path, {});
            }
            if (options.url) {
                return _postOnline(modelUrl, options.url, {});
            }
        }
    };

    return {
        analyzeImage: analyzeImage,
        thumbnail: thumbnail,
        ocr: ocr,
        models: models
    };
};

module.exports = vision;
