var request = require('request').defaults({
        headers: {'User-Agent': 'nodejs/0.4.0'}}),
    _Promise = require('bluebird');

const rootPath = '/bing/v5.0';
const spellCheckPath = '/spellcheck';

/**
 * @namespace
 * @memberof Client
 */
var text = function (key, host) {
    /**
     * @private
     */
    function _return(error, response, resolve, reject) {
        if (error) {
            return reject(error);
        }
        if (response.statusCode === 200) {
            resolve(response.body);
        }

        reject(response.body.error || response.body);
    }

    /**
     * (Private)
     * @private
     * @param  {string} mode        -
     * @param  {string} text       - Path to image
     * @param  {string} preContextText  - Optional context preceding the text
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _check(mode, text, preContextText, postContextText, market) {
        return new _Promise(function (resolve, reject) {
            let qs = {
                mode: mode,
                text: text,
                preContextText: preContextText,
                postContextText: postContextText,
                mkt: market
            };
            request.get({
                uri: host + rootPath + spellCheckPath,
                headers: {'Ocp-Apim-Subscription-Key': key},
                qs: qs,
                json: true
            }, (error, response) => _return(error, response, resolve, reject));
        });
    }

    /**
     * Proofs a word or phrase.  Offers Microsoft Office Word-like spelling corrections. Longer phrases can
     * be checked, and the result will include casing corrections while avoiding aggressive corrections.
     *
     * @param  {string}  text             - Word or phrase to spell check.
     * @param  {string?} preContextText   - Optional context of one or more words preceding the target word/phrase.
     * @param  {string?} postContextText  - Optional context of one or more words following the target word/phrase.
     * @param  {string?} market           - Optional market
     * @return {Promise}                  - A promise in which the resulting JSON is returned.
     */
    function proof(text, preContextText, postContextText, market) {
        return _check('proof', text, preContextText, postContextText, market);
    }

    /**
     * Spell checks a word or phrase.  Spell checks offers search-engine-like corrections.  Short phrases
     * (up to 9 tokens) will be checked, and the result will be optimized for search queries, both in terms
     * of performance and relevance.
     *
     * @param  {string}  text             - Word or phrase to spell check.
     * @param  {string?} preContextText   - Optional context of one or more words preceding the target word/phrase.
     * @param  {string?} postContextText  - Optional context of one or more words following the target word/phrase.
     * @param  {string?} market           - Optional market
     * @return {Promise}                  - A promise in which the resulting JSON is returned.
     */
    function spellCheck(text, preContextText, postContextText, market) {
        return _check('spell', text, preContextText, postContextText, market);
    }

    return {
        proof: proof,
        spellCheck: spellCheck
    };
};

module.exports = text;
