var request = require('request').defaults({
        baseUrl: 'https://api.projectoxford.ai/text/weblm/v1.0/',
        headers: {'User-Agent': 'nodejs/0.3.0'}}),
    _Promise = require('bluebird');

const workBreakUrl = '/breakIntoWords';
const listModelsUrl = '/models';
const generateNextWordsUrl = '/generateNextWords';
const calculateJointProbUrl = '/calculateJointProbability';
const calculateCondProbUrl = '/calculateConditionalProbability';

/**
 * @namespace
 * @memberof Client
 */
var weblm = function (key) {
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

        return resolve(response.body.error || response.body);
    }

    /**
     * List available language models for the service currently.
     *
     * @return {Promise} - Promise resolving with the resulting JSON
     */
    function listModels() {
        return new _Promise(function (resolve, reject) {
            request({
                uri: listModelsUrl,
                json: true,
                headers: {
                    'Ocp-Apim-Subscription-Key': key
                }
            }, (error, response) => _return(error, response, resolve, reject));
        });
    }

    /**
     * (Private) Helper method for processing text.
     *
     * @private
     * @param  {string} url                    - Url of the API
     * @param  {string} model                  - Name of model. Currently one of title/anchor/query/body
     * @param  {Object} qs                     - Method-specific queryString options
     * @param  {Object} body                   - Method-specific body, optional
     * @param  {Object} options                - Options object
     * @param  {Number} options.order          - Optional N-gram order. Default is 5
     * @param  {Number} options.maxCandidates  - Optional maximum candidate count. Default is 5
     * @return {Promise}                       - Promise resolving with the resulting JSON
     */
    function _processWords(url, model, qs, body, options) {
        qs.model = model;
        if (options && options.order) {
            qs.order = options.order;
        }
        if (options && options.maxCandidates) {
            qs.maxNumOfCandidatesReturned = options.maxCandidates;
        }
        return new _Promise(function (resolve, reject) {
            request.post({
                uri: url,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/json'
                },
                qs: qs,
                json: true,
                body: body
            }, (error, response) => _return(error, response, resolve, reject));
        });
    }

    /**
     * Breaks text in to consituent words
     *
     * @param  {string} model                  - Name of model. Currently one of title/anchor/query/body
     * @param  {string} text                   - Text to break.  E.g. onetwothree
     * @param  {Object} options                - Options object
     * @param  {Number} options.order          - Optional N-gram order. Default is 5
     * @param  {Number} options.maxCandidates  - Optional maximum candidate count. Default is 5
     * @return {Promise}                       - Promise resolving with the resulting JSON
     */
    function breakIntoWords(model, text, options) {
        return _processWords(workBreakUrl, model, {text: text}, undefined, options);
    }

    /**
     * Generates a list of candidate of words that would follow the a given sequence of one or more words
     *
     * @param  {string} model                  - Name of model. Currently one of title/anchor/query/body
     * @param  {string} words                  - Text to break.  E.g. 'hello world wide'
     * @param  {Object} options                - Options object
     * @param  {Number} options.order          - Optional N-gram order. Default is 5
     * @param  {Number} options.maxCandidates  - Optional maximum candidate count. Default is 5
     * @return {Promise}                       - Promise resolving with the resulting JSON
     */
    function generateWords(model, words, options) {
        return _processWords(generateNextWordsUrl, model, {words: words}, undefined, options);
    }

    /**
     * Generates a list of candidate of words that would follow the a given sequence of one or more words
     *
     * @param  {string} model                  - Name of model. Currently one of title/anchor/query/body
     * @param  {string[]} phrases              - One or more phrases for which to look up the probalities of the word sequences
     * @param  {Number} order                  - Optional N-gram order. Default is 5
     * @return {Promise}                       - Promise resolving with the resulting JSON
     */
    function getJointProbabilities(model, phrases, order) {
        return _processWords(calculateJointProbUrl, model, {}, {queries: phrases}, {order: order});
    }

    /**
     * Generates a list of candidate of words that would follow the a given sequence of one or more words
     *
     * @param  {string} model                  - Name of model. Currently one of title/anchor/query/body
     * @param  {Array} queries                 - One of more objects consisting of 'words'/'word' pairs,
     *      where the conditional probability of 'word' in the context of 'words' is computed.
     * @param  {Number} order                  - Optional N-gram order. Default is 5
     * @return {Promise}                       - Promise resolving with the resulting JSON
     */
    function getConditionalProbabilities(model, queries, order) {
        return _processWords(calculateCondProbUrl, model, {}, {queries: queries}, {order: order});
    }

    return {
        breakIntoWords: breakIntoWords,
        generateWords: generateWords,
        getConditionalProbabilities: getConditionalProbabilities,
        getJointProbabilities: getJointProbabilities,
        listModels: listModels
    };
};

module.exports = weblm;
