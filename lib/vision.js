var request = require('request'),
    Promise = require('Bluebird'),
    fs = require('fs');

const analyzeUrl = 'https://api.projectoxford.ai/vision/v1/analyses';
const thumbnailUrl = 'https://api.projectoxford.ai/vision/v1/thumbnails';

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
    var _thumbnailLocal = function (image, options) {
        return new Promise(function (resolve, reject) {
            fs.createReadStream(image).pipe(request.post({
                uri: thumbnailUrl,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/octet-stream'
                },
                qs: options
            }, (error, response) => _return(error, JSON.parse(response), resolve, reject))
        )});
    };

    /**
     * (Private) Get a thumbnail for am online image
     * @param  {string} image       - url to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    var _thumbnailOnline = function (image, options) {
        return new Promise(function (resolve, reject) {
            request.post({
                uri: thumbnailUrl,
                headers: {'Ocp-Apim-Subscription-Key': key},
                json: true,
                body: {'url': image},
                qs: options
            }, (error, response) => _return(error, response, resolve, reject))
        });
    }

    /**
     * [thumbnail description]
     * @param  {Object}  options                - Options object describing features to extract
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
            return _thumbnailLocal(options.path, qs);
        }
        if (options.url) {
            return _thumbnailOnline(options.url, qs);
        }
    }

    return {
        analyzeImage: analyzeImage
    }
}

module.exports = vision;
