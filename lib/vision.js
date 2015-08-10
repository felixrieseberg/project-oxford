var request = require('request'),
    Promise = require('Bluebird'),
    fs = require('fs');

const analyzeUrl = 'https://api.projectoxford.ai/vision/v1/analyses';
const thumbnailUrl = 'https://api.projectoxford.ai/vision/v1/thumbnails';
const ocrUrl = 'https://api.projectoxford.ai/vision/v1/ocr';

var vision = function (key) {
    var _return = function (error, response, resolve, reject) {
        if (error) {
            return reject(error);
        }

        return resolve(response);
    };

    /**
     * (Private) Analyze a local image, using a fs pipe
     * @param  {string} image       - Path to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    var _analyzeLocal = function (image, options) {
        return new Promise(function (resolve, reject) {
            fs.createReadStream(image).pipe(request.post({
                uri: analyzeUrl,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/octet-stream'
                },
                qs: options
            }, (error, response) => _return(error, JSON.parse(response), resolve, reject))
        )});
    };

    /**
     * (Private) Analyze an online image
     * @param  {string} image       - Url to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    var _analyzeOnline = function (image, options) {
        return new Promise(function (resolve, reject) {
            request.post({
                uri: analyzeUrl,
                headers: {'Ocp-Apim-Subscription-Key': key},
                json: true,
                body: {'url': image},
                qs: options
            }, (error, response) => _return(error, response, resolve, reject))
        });
    };

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
     * @return {[type]}         [description]
     */
    var analyzeImage = function (options) {
        let test = /(ImageType)|(Color)|(Faces)|(Adult)|(Categories)/;
        let query = [];

        Object.keys(options).forEach((value, key) => {
            if (key.toString().match(test) && value) {
                query.push(key.toString());
            }
        });

        
        let qs = {visualFeatures: query.join()}

        if (options.path) {
            return _analyzeLocal(options.path, qs);
        }
        if (options.url) {
            return _analyzeOnline(options.url, qs);
        }
    };

    /**
     * (Private) Get a thumbnail for a local image, using a fs pipe
     * @param  {string} image       - Path to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    var _thumbnailLocal = function (image, options, pipe) {
        return new Promise(function (resolve, reject) {
            fs.createReadStream(image).pipe(request.post({
                uri: thumbnailUrl,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/octet-stream'
                },
                qs: options
            }, (error, response) => _return(error, response, resolve, reject)))
            .pipe(pipe);
        });
    };

    /**
     * (Private) Get a thumbnail for am online image
     * @param  {string} image       - url to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    var _thumbnailOnline = function (image, options, pipe) {
        return new Promise(function (resolve, reject) {
            request.post({
                uri: thumbnailUrl,
                headers: {'Ocp-Apim-Subscription-Key': key},
                json: true,
                body: {'url': image},
                qs: options,
            }, (error, response) => _return(error, response, resolve, reject))
            .pipe(pipe);
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
    var thumbnail = function (options) {
        let qs = {
            width: (options.width) ? options.width : 50,
            height: (options.height) ? options.height : 50,
            smartCropping: (options.smartCropping) ? options.smartCropping : false
        };

        if (options.path) {
            return _thumbnailLocal(options.path, qs, options.pipe);
        }
        if (options.url) {
            return _thumbnailOnline(options.url, qs, options.pipe);
        }
    };

    /**
     * (Private) OCR a local image, using a fs pipe
     * @param  {string} image       - Path to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    var _ocrLocal = function (image, options) {
        return new Promise(function (resolve, reject) {
            fs.createReadStream(image).pipe(request.post({
                uri: ocrUrl,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/octet-stream'
                },
                qs: options
            }, (error, response) => _return(error, response, resolve, reject)));
        });
    };

    /**
     * (Private) OCR an online image
     * @param  {string} image       - url to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    var _ocrOnline = function (image, options) {
        return new Promise(function (resolve, reject) {
            request.post({
                uri: ocrUrl,
                headers: {'Ocp-Apim-Subscription-Key': key},
                json: true,
                body: {'url': image},
                qs: options,
            }, (error, response) => _return(error, response, resolve, reject));
        });
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
    var ocr = function (options) {
        let qs = {
            language: (options.language) ? options.language : 'unk',
            detectOrientation: (options.detectOrientation) ? options.detectOrientation : true,
        }

        if (options.path) {
            return _ocrLocal(options.path, qs);
        }
        if (options.url) {
            return _ocrOnline(options.url, qs);
        }
    }

    return {
        analyzeImage: analyzeImage,
        thumbnail: thumbnail,
        ocr: ocr
    }
}

module.exports = vision;
