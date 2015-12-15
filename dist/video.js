'use strict';

var request = require('request').defaults({
    headers: { 'User-Agent': 'nodejs/0.3.0' } }),
    fs = require('fs'),
    _Promise = require('bluebird');

var apiBaseUrl = 'https://api.projectoxford.ai/video/v1.0/';
var trackFaceUrl = apiBaseUrl + 'trackface';
var detectMotionrUrl = apiBaseUrl + 'detectmotion';
var stabilizeUrl = apiBaseUrl + 'stabilize';

/**
 * @namespace
 * @memberof Client
 */
var video = function video(key) {
    /**
     * @private
     */
    function _return(error, response, resolve, reject) {
        if (error) {
            return reject(error);
        }
        if (response.statusCode === 202) {
            return resolve({ url: response.headers['operation-location'] });
        }
        if (response.statusCode === 200) {
            resolve(response.body);
        }

        reject(response.body.error || response.body);
    }

    /**
     * (Private) Post an online video to a face API URL
     *
     * @private
     * @param  {string} url         - Url to POST
     * @param  {string} video       - Url to the video
     * @param  {object} options     - Querystring object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _postOnline(url, video, options) {
        return new _Promise(function (resolve, reject) {
            request.post({
                uri: url,
                headers: { 'Ocp-Apim-Subscription-Key': key },
                json: true,
                body: { url: video },
                qs: options
            }, function (error, response) {
                return _return(error, response, resolve, reject);
            });
        });
    }

    /**
     * (Private) Post an video stream to a face API URL
     *
     * @private
     * @param  {string} url         - Url to POST
     * @param  {stream} stream      - Stream for the video
     * @param  {object} options     - Querystring object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _postStream(url, stream, options) {
        return new _Promise(function (resolve, reject) {
            stream.pipe(request.post({
                uri: url,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/octet-stream'
                },
                qs: options
            }, function (error, response) {
                _return(error, response, resolve, reject);
            }));
        });
    }

    /**
     * (Private) Post a local video file to a face API URL
     *
     * @private
     * @param  {string} url         - Url to POST
     * @param  {string} video       - Path to the video
     * @param  {object} options     - Querystring object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _postLocal(url, video, options) {
        return _postStream(url, fs.createReadStream(video), options);
    }

    /**
     * (Private)  Post an video to a face API URL.
     *
     * @private
     * @param  {string} url           - URL to post
     * @param  {object} source        - Union of sources
     * @param  {string} source.url    - URL of video
     * @param  {string} source.path   - Local path of video
     * @param  {string} source.stream - Stream of video
     * @param  {object} qs            - Querystring object
     * @return {Promise}              - Promise resolving with the resulting JSON
     */
    function _postVideo(url, source, qs) {
        if (source.url && source.url !== '') {
            return _postOnline(url, source.url, qs);
        }
        if (source.path && source.path !== '') {
            return _postLocal(url, source.path, qs);
        }
        if (source.stream) {
            return _postStream(url, source.stream, qs);
        }
    }

    /**
     * Start a face-tracking processor
     * Faces in a video will be tracked.
     *
     * @param  {object}  options                        - Options object
     * @param  {string}  options.url                    - URL to video to be used
     * @param  {string}  options.path                   - Path to video to be used
     * @param  {stream}  options.stream                 - Stream for video to be used
     * @return {Promise}                                - Promise resolving with the resulting JSON
     */
    function trackFace(options) {
        return _postVideo(trackFaceUrl, options);
    }

    /**
     * Start a motion-tracking processor
     * Motion in a video will be tracked.
     *
     * @param  {object}  options                        - Options object
     * @param  {string}  options.url                    - URL to video to be used
     * @param  {string}  options.path                   - Path to video to be used
     * @param  {stream}  options.stream                 - Stream for video to be used
     * @return {Promise}                                - Promise resolving with the resulting JSON
     */
    function detectMotion(options) {
        return _postVideo(detectMotionrUrl, options);
    }

    /**
     * Start a stablization processor
     * A stabilized version of you video will be generated.
     *
     * @param  {object}  options                        - Options object
     * @param  {string}  options.url                    - URL to video to be used
     * @param  {string}  options.path                   - Path to video to be used
     * @param  {stream}  options.stream                 - Stream for video to be used
     * @return {Promise}                                - Promise resolving with the resulting JSON
     */
    function stabilize(options) {
        return _postVideo(stabilizeUrl, options);
    }

    /**
     * @namespace
     * @memberOf video
     */
    var result = {
        /**
        * Checks the result of a given operation.  When an operation is deemed completed, the
        * status of the returned object should be 'Succeeded' (or, possibly, 'Failed'.) For
        * operations which return a JSON payload, the stringified-JSON is return in the
        * processingResult field.  For operations which return a video, the location of the
        * video is provided in the resourceLocation field.  You can use the getVideo method
        * to help you retrieve that, as this would automatically attach the API key to request.
        *
        * @param  {string[]} faces     - Array of faceIds to use
        * @return {Promise}            - Promise resolving with the resulting JSON
        */
        get: function get(operation) {
            return new _Promise(function (resolve, reject) {
                request({
                    uri: operation.url,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
                    response.body = JSON.parse(response.body);
                    _return(error, response, resolve, reject);
                });
            });
        },

        /**
        * Downloads the resulting video, for processors that returning videos instead of metadata.
        * Currently this applies to the the stabilize operation.
        *
        * @param  {string} url   - URL of the resource
        * @param  {Object} pipe  - Destination for video, typically a fs object
        * @return {Promise}      - Promise resolving with the resulting video
        */
        getVideo: function getVideo(url, pipe) {
            return new _Promise(function (resolve, reject) {
                request({
                    uri: url,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
                    return _return(error, response, resolve, reject);
                }).pipe(pipe);
            });
        }
    };

    return {
        detectMotion: detectMotion,
        stabilize: stabilize,
        trackFace: trackFace,
        result: result
    };
};

module.exports = video;
