var request = require('request'),
	Promise = require('Bluebird'),
	fs = require('fs');

const detectUrl = 'https://api.projectoxford.ai/face/v0/detections';
const similarUrl = 'https://api.projectoxford.ai/face/v0/findsimilars';
const groupingUrl = 'https://api.projectoxford.ai/face/v0/groupings';
const identifyUrl = 'https://api.projectoxford.ai/face/v0/identifications';
const verifyUrl = 'https://api.projectoxford.ai/face/v0/verifications';

var face = function (key) {
	/**
	 * (Private) Call the Face Detected API using a local image
	 * 
	 * @param  {string} image   	- Path to the image
	 * @param  {object} options 	- Querystring object
	 * @return {Promise}        	- Promise resolving with the resulting JSON
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
	 * (Private) Call the Face Detected API using a uri to an online image
	 * 
	 * @param  {string} image   	- Url to the image
	 * @param  {object} options 	- Querystring object
	 * @return {Promise}        	- Promise resolving with the resulting JSON
	 */
	var _detectOnline = function (image, options) {
		return new Promise(function (resolve, reject) {
			request.post({
				uri: detectUrl,
				headers: {'Ocp-Apim-Subscription-Key': key},
				json: true,
				body: {'url': image},
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
	 * ------------------------------------------------------------------------------------
	 * Detects human faces in an image and returns face locations, face landmarks, and 
	 * optional attributes including head-pose, gender, and age. Detection is an essential
	 * API that provides faceId to other APIs like Identification, Verification,
	 * and Find Similar.
	 * 
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
	 * ------------------------------------------------------------------------------------
	 * @param  {string[]} faces  	- Array of faceIds to use
	 * @return {Promise}        	- Promise resolving with the resulting JSON
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
				headers: {'Ocp-Apim-Subscription-Key': key},
				json: true,
				body: faces
			}, function (error, response) {
				if (error) {
					return reject(error);
				}

				return resolve(response);
			})
		});
	};
	
	/**
	 * Divides candidate faces into groups based on face similarity using faceIds.
	 * ------------------------------------------------------------------------------------
	 * The output is one or more disjointed face groups and a MessyGroup. 
	 * A face group contains the faces that have similar looking, often of the same person. 
	 * There will be one or more face groups ranked by group size, i.e. number of face. 
	 * Faces belonging to the same person might be split into several groups in the result. 
	 * The MessyGroup is a special face group that each face is not similar to any other 
	 * faces in original candidate faces. The messyGroup will not appear in the result if 
	 * all faces found their similar counterparts. The candidate face list has a 
	 * limit of 100 faces.
	 * 
	 * @param  {string[]} faces  	- Array of faceIds to use
	 * @return {Promise}         	- Promise resolving with the resulting JSON
	 */
	var grouping = function (faces) {
		return new Promise(function (resolve, reject) {
			if (faces) {
				faces = {'faceIds': faces}
			}
			
			request.post({
				uri: similarUrl,
				headers: {'Ocp-Apim-Subscription-Key': key},
				json: true,
				body: faces
			}, function (error, response) {
				if (error) {
					return reject(error);
				}

				return resolve(response);
			})
		});
	};

	/**
	 * Identifies persons from a person group by one or more input faces.
	 * ------------------------------------------------------------------------------------
	 * To recognize which person a face belongs to, Face Identification needs a person group 
	 * that contains number of persons. Each person contains one or more faces. After a person
	 * group prepared, it should be trained to make it ready for identification. Then the 
	 * identification API compares the input face to those persons' faces in person group and
	 * returns the best-matched candidate persons, ranked by confidence. 
	 * 
	 * @param  {string[]} faces  	- Array of faceIds to use
	 * @return {Promise}         	- Promise resolving with the resulting JSON
	 */
	var identify = function (faces, options) {
		return new Promise(function (resolve, reject) {
			let body = {
				'faceIds': faces
			};

			if (options && options.personGroupId) {
				body['personGroupId'] = options.personGroupId;
			}

			if (options && options.maxNumOfCandidatesReturned) {
				body['maxNumOfCandidatesReturned'] = options.maxNumOfCandidatesReturned;
			}

			request.post({
				uri: identifyUrl,
				headers: {'Ocp-Apim-Subscription-Key': key},
				json: true,
				body: faces
			}, function (error, response) {
				if (error) {
					return reject(error);
				}

				return resolve(response);
			});
		});
	};

	/**
	 * Analyzes two faces and determine whether they are from the same person. 
	 * ------------------------------------------------------------------------------------
	 * Verification works well for frontal and near-frontal faces.
	 * For the scenarios that are sensitive to accuracy please use with own judgment.
	 * @param  {string[]} faces  	- Array containing two faceIds to use
	 * @return {Promise}         	- Promise resolving with the resulting JSON
	 */
	var verify = function (faces) {
		return new Promise(function (resolve, reject) {
			if (faces && faces.length > 1) {
				let body = {
					'faceId1': faces[0],
					'faceId2': faces[1]
				}
			}

			request.post({
				uri: verifyUrl,
				headers: {'Ocp-Apim-Subscription-Key': key},
				json: true,
				body: faces
			}, function (error, response) {
				if (error) {
					return reject(error);
				}

				return resolve(response);
			});
		})
	}

	return {
		detect: detect,
		similar: similar,
		grouping: grouping,
		identify: identify,
		verify: verify
	}
}

module.exports = face;