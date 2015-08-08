var request = require('request'),
	Promise = require('Bluebird'),
	fs = require('fs');

const detectUrl = 'https://api.projectoxford.ai/face/v0/detections';
const similarUrl = 'https://api.projectoxford.ai/face/v0/findsimilars';

var face = function (key) {
	/**
	 * Call the Face Detected API using a local image
	 * @param  {string} image   - Path to the image
	 * @param  {object} options - Querystring object
	 * @return {Promise}        - Promise resolving with the resulting JSON
	 */
	var _detectLocal = function (image, options) {
		return new Promise(function (resolve, reject) {
			fs.createReadStream(image).pipe(request.post({
				uri: detectUrl,
				headers: {
					'Ocp-Apim-Subscription-Key': key,
					'Content-Type': 'application/octet-stream'
				},
				qs: options
			}, function (error, response) {
				if (error) {
					return reject(error);
				}

				return resolve(response);
			})
		)});
	};

	/**
	 * Call the Face Detected API using a uri to an online iage
	 * @param  {string} image   - Url to the image
	 * @param  {object} options - Querystring object
	 * @return {Promise}        - Promise resolving with the resulting JSON
	 */
	var _detectOnline = function (image, options) {
		return new Promise(function (resolve, reject) {
			request.post({
				uri: detectUrl,
				headers: {
					'Ocp-Apim-Subscription-Key': key,
				},
				json: true,
				body: {
					'url': image
				},
				qs: options
			}, function (error, response) {
				if (error) {
					return reject(error);
				}

				return resolve(response);
			})
		});
	};

	/**
	 * Call the Face Detected API
	 * @param  {object}  options 						- Options object
	 * @param  {boolean} options.analyzesFaceLandmarks  - Analyze face landmarks?
	 * @param  {boolean} options.analyzesAge 			- Analyze age?
	 * @param  {boolean} options.analyzesGender 		- Analyze gender?
	 * @param  {boolean} options.analyzesHeadPose 		- Analyze headpose?
	 * @return {Promise}        						- Promise resolving with the resulting JSON
	 */
	var detect = function (options) {
		let qs = {
			analyzesFaceLandmarks: options.analyzesFaceLandmarks ? true : false,
			analyzesAge: options.analyzesAge ? true : false,
			analyzesGender: options.analyzesGender ? true : false,
			analyzesHeadPose: options.analyzesHeadPose ? true : false
		}

		if (options.url && options.url !== '') {
			return _detectOnline(options.url, qs);
		}

		if (options.path && options.path !== '') {
			return _detectLocal(options.path, qs);
		}
	};

	/**
	 * Detect similar faces using faceIds (as returned from the detect API)
	 * @param  {string[]} faces  - Array of faceIds to detec
	 * @return {Promise}        - Promise resolving with the resulting JSON
	 */
	var similar = function (faces) {
		return new Promise(function (resolve, reject) {
			if (faces.length === 1) {
				faces = {'faceId': faces[0]};
			} else {
				faces = {'faceIds': faces};
			}

			request.post({
				uri: similarUrl,
				headers: {
					'Ocp-Apim-Subscription-Key': key,
				},
				json: true,
				body: faces
			}, function (error, response) {
				if (error) {
					return reject(error);
				}

				return resolve(response);
			})
		});
	}

	return {
		detect: detect,
		similar: similar
	}
}

module.exports = face;