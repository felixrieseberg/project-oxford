var request = require('request'),
    fs = require('fs'),
    _Promise = require('bluebird');

const emotionUrl = 'https://api.projectoxford.ai/emotion/v1.0/recognize';


var emotion = function(key) {
    /**
     * @private
     */
    function _return(error, response, resolve, reject) {
        if (error) {
            return reject(error);
        }

        if (response.statusCode != 200) {
            reject(response.body);
        }

        return resolve(response.body);
    };

    /**
     * (Private) Analyze a local image, using a fs pipe
     * @private
     * @param  {string} image       - Path to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _emotionLocal(image, options) {
        return new _Promise(function (resolve, reject) {
            fs.createReadStream(image).pipe(request.post({
                uri: emotionUrl,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/octet-stream'
                },
                qs: options
            }, (error, response) => {
                response.body = JSON.parse(response.body);
                _return(error, response, resolve, reject);
            }));
        });
    };

    /**
     * (Private) Analyze an online image
     * @private
     * @param  {string} image       - Url to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _emotionOnline(image, options) {
        return new _Promise(function (resolve, reject) {
            request.post({
                uri: emotionUrl,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/json'
                },
                json: true,
                body: {url: image},
                qs: options
            }, (error, response) => _return(error, response, resolve, reject));
        });
    };

    function analyzeEmotion(options) {
        let qs = {faceRectangles: options.faceRectangles};

        if (options.path) {
            return _emotionLocal(options.path, qs);
        }
        if (options.url) {
            return _emotionOnline(options.url, qs);
        }
    };

    return {
        analyzeEmotion: analyzeEmotion
    };
}

module.exports = emotion;