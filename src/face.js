var request = require('request'),
    fs = require('fs'),
    _Promise = require('bluebird');

const detectUrl = 'https://api.projectoxford.ai/face/v0/detections';
const similarUrl = 'https://api.projectoxford.ai/face/v0/findsimilars';
const groupingUrl = 'https://api.projectoxford.ai/face/v0/groupings';
const identifyUrl = 'https://api.projectoxford.ai/face/v0/identifications';
const verifyUrl = 'https://api.projectoxford.ai/face/v0/verifications';
const personGroupUrl = 'https://api.projectoxford.ai/face/v0/persongroups';
const personUrl = 'https://api.projectoxford.ai/face/v0/persongroups';

/**
 * @namespace
 * @memberof Client
 */
var face = function (key) {
    /**
     * @private
     */
    function _return(error, response, resolve, reject) {
        if (error) {
            return reject(error);
        }

        if (typeof response.body === "string" && response.body.length > 0) {
            response.body = JSON.parse(response.body);
        }

        if (response.statusCode != 200) {
            reject(response.body);
        }

        return resolve(response.body);
    };

    /**
     * (Private) Call the Face Detected API using a stream of an image
     *
     * @private
     * @param  {stream} stream      - Stream for the image
     * @param  {object} options     - Querystring object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _detectStream(stream, options) {
        return new _Promise(function (resolve, reject) {
            stream.pipe(request.post({
                uri: detectUrl,
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
     * (Private) Call the Face Detected API using a local image
     *
     * @private
     * @param  {string} image       - Path to the image
     * @param  {object} options     - Querystring object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _detectLocal(image, options) {
        return _detectStream(fs.createReadStream(image), options);
    };

    /**
     * (Private) Call the Face Detected API using a uri to an online image
     *
     * @private
     * @param  {string} image       - Url to the image
     * @param  {object} options     - Querystring object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _detectOnline(image, options) {
        return new _Promise(function (resolve, reject) {
            request.post({
                uri: detectUrl,
                headers: {'Ocp-Apim-Subscription-Key': key},
                json: true,
                body: {url: image},
                qs: options
            }, (error, response) => _return(error, response, resolve, reject));
        });
    };


    /**
     * Call the Face Detected API
     * Detects human faces in an image and returns face locations, face landmarks, and
     * optional attributes including head-pose, gender, and age. Detection is an essential
     * API that provides faceId to other APIs like Identification, Verification,
     * and Find Similar.
     *
     * @param  {object}  options                        - Options object
     * @param  {string}  options.url                    - URL to image to be used
     * @param  {string}  options.path                   - Path to image to be used
     * @param  {stream}  options.stream                 - Stream for image to be used
     * @param  {boolean} options.analyzesFaceLandmarks  - Analyze face landmarks?
     * @param  {boolean} options.analyzesAge            - Analyze age?
     * @param  {boolean} options.analyzesGender         - Analyze gender?
     * @param  {boolean} options.analyzesHeadPose       - Analyze headpose?
     * @return {Promise}                                - Promise resolving with the resulting JSON
     */
    function detect(options) {
        let qs = {
            analyzesFaceLandmarks: options.analyzesFaceLandmarks ? true : false,
            analyzesAge: options.analyzesAge ? true : false,
            analyzesGender: options.analyzesGender ? true : false,
            analyzesHeadPose: options.analyzesHeadPose ? true : false
        };

        if (options.url && options.url !== '') {
            return _detectOnline(options.url, qs);
        }

        if (options.path && options.path !== '') {
            return _detectLocal(options.path, qs);
        }

        if (options.stream) {
            return _detectStream(options.stream, qs);
        }
    };

    /**
     * Detect similar faces using faceIds (as returned from the detect API)
     * @param  {string} sourceFace          - String of faceId for the source face
     * @param  {string[]} candidateFaces    - Array of faceIds to use as candidates
     * @return {Promise}                    - Promise resolving with the resulting JSON
     */
    function similar(sourceFace, candidateFaces) {
        return new _Promise(function (resolve, reject) {
            let faces = {
                faceId: sourceFace,
                faceIds: candidateFaces
            }

            request.post({
                uri: similarUrl,
                headers: {'Ocp-Apim-Subscription-Key': key},
                json: true,
                body: faces
            }, (error, response) => _return(error, response, resolve, reject));
        });
    };

    /**
     * Divides candidate faces into groups based on face similarity using faceIds.
     * The output is one or more disjointed face groups and a MessyGroup.
     * A face group contains the faces that have similar looking, often of the same person.
     * There will be one or more face groups ranked by group size, i.e. number of face.
     * Faces belonging to the same person might be split into several groups in the result.
     * The MessyGroup is a special face group that each face is not similar to any other
     * faces in original candidate faces. The messyGroup will not appear in the result if
     * all faces found their similar counterparts. The candidate face list has a
     * limit of 100 faces.
     *
     * @param  {string[]} faces     - Array of faceIds to use
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function grouping(faces) {
        return new _Promise(function (resolve, reject) {
            if (faces) {
                faces = {faceIds: faces};
            }

            request.post({
                uri: groupingUrl,
                headers: {'Ocp-Apim-Subscription-Key': key},
                json: true,
                body: faces
            }, (error, response) => _return(error, response, resolve, reject));
        });
    };

    /**
     * Identifies persons from a person group by one or more input faces.
     * To recognize which person a face belongs to, Face Identification needs a person group
     * that contains number of persons. Each person contains one or more faces. After a person
     * group prepared, it should be trained to make it ready for identification. Then the
     * identification API compares the input face to those persons' faces in person group and
     * returns the best-matched candidate persons, ranked by confidence.
     *
     * @param  {string[]} faces     - Array of faceIds to use
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function identify(faces, options) {
        return new _Promise(function (resolve, reject) {
            let body = {};

            if (options && options.personGroupId) {
                body.personGroupId = options.personGroupId;
            }

            if (options && options.maxNumOfCandidatesReturned) {
                body.maxNumOfCandidatesReturned = options.maxNumOfCandidatesReturned;
            }

            body.faceIds = faces;

            request.post({
                uri: identifyUrl,
                headers: {'Ocp-Apim-Subscription-Key': key},
                json: true,
                body: body
            }, (error, response) => _return(error, response, resolve, reject));
        });
    };

    /**
     * Analyzes two faces and determine whether they are from the same person.
     * Verification works well for frontal and near-frontal faces.
     * For the scenarios that are sensitive to accuracy please use with own judgment.
     * @param  {string[]} faces     - Array containing two faceIds to use
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function verify(faces) {
        return new _Promise(function (resolve, reject) {
            if (faces && faces.length > 1) {
                let body = {
                    faceId1: faces[0],
                    faceId2: faces[1]
                };

                request.post({
                    uri: verifyUrl,
                    headers: {'Ocp-Apim-Subscription-Key': key},
                    json: true,
                    body: body
                }, (error, response) => _return(error, response, resolve, reject));
            } else {
                return reject('Faces array must contain two face ids');
            }
        });
    };

    /**
     * @namespace
     * @memberof face
     */
    var personGroup = {
        /**
         * Creates a new person group with a user-specified ID.
         * A person group is one of the most important parameters for the Identification API.
         * The Identification searches person faces in a specified person group.
         *
         * @param  {string} personGroupId       - Numbers, en-us letters in lower case, '-', '_'. Max length: 64
         * @param  {string} name                - Person group display name. The maximum length is 128.
         * @param  {string} userData            - User-provided data attached to the group. The size limit is 16KB.
         * @return {Promise}                    - Promise resolving with the resulting JSON
         */
        create: function (personGroupId, name, userData) {
            return new _Promise((resolve, reject) => {
                request.put({
                    uri: personGroupUrl + '/' + personGroupId,
                    headers: {'Ocp-Apim-Subscription-Key': key},
                    json: true,
                    body: {
                        name: name,
                        userData: userData
                    }
                }, function (error, response) {
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Deletes an existing person group.
         *
         * @param  {string} personGroupId       - Name of person group to delete
         * @return {Promise}                    - Promise resolving with the resulting JSON
         */
        delete: function (personGroupId) {
            return new _Promise((resolve, reject) => {
                request({
                    method: 'DELETE',
                    uri: personGroupUrl + '/' + personGroupId,
                    headers: {'Ocp-Apim-Subscription-Key': key}
                }, function (error, response) {
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Gets an existing person group.
         *
         * @param  {string} personGroupId       - Name of person group to get
         * @return {Promise}                    - Promise resolving with the resulting JSON
         */
        get: function (personGroupId) {
            return new _Promise((resolve, reject) => {
                request({
                    uri: personGroupUrl + '/' + personGroupId,
                    headers: {'Ocp-Apim-Subscription-Key': key}
                }, function (error, response) {
                    response.body = JSON.parse(response.body);
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Retrieves the training status of a person group. Training is triggered by the Train PersonGroup API.
         * The training will process for a while on the server side. This API can query whether the training
         * is completed or ongoing.
         *
         * @param  {string} personGroupId       - Name of person group to get
         * @return {Promise}                    - Promise resolving with the resulting JSON
         */
        trainingStatus: function (personGroupId) {
            return new _Promise((resolve, reject) => {
                request({
                    uri: personGroupUrl + '/' + personGroupId + '/training',
                    headers: {'Ocp-Apim-Subscription-Key': key}
                }, function (error, response) {
                    response.body = JSON.parse(response.body);
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Starts a person group training.
             * Training is a necessary preparation process of a person group before identification.
         * Each person group needs to be trained in order to call Identification. The training
         * will process for a while on the server side even after this API has responded.
         *
         * @param  {string} personGroupId       - Name of person group to get
         * @return {Promise}                    - Promise resolving with the resulting JSON
         */
        trainingStart: function (personGroupId) {
            return new _Promise((resolve, reject) => {
                request.post({
                    uri: personGroupUrl + '/' + personGroupId + '/training',
                    headers: {'Ocp-Apim-Subscription-Key': key}
                }, function (error, response) {
                    response.body = JSON.parse(response.body);
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Updates an existing person group's display name and userData.
         *
         * @param  {string} personGroupId       - Numbers, en-us letters in lower case, '-', '_'. Max length: 64
         * @param  {string} name                - Person group display name. The maximum length is 128.
         * @param  {string} userData            - User-provided data attached to the group. The size limit is 16KB.
         * @return {Promise}                    - Promise resolving with the resulting JSON
         */
        update: function (personGroupId, name, userData) {
            return new _Promise((resolve, reject) => {
                request.patch({
                    uri: personGroupUrl + '/' + personGroupId,
                    headers: {'Ocp-Apim-Subscription-Key': key},
                    json: true,
                    body: {
                        name: name,
                        userData: userData
                    }
                }, function (error, response) {
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Lists all person groups in the current subscription.
         * @return {Promise}                    - Promise resolving with the resulting JSON
         */
        list: function () {
            return new _Promise((resolve, reject) => {
                request({
                    uri: personGroupUrl,
                    headers: {'Ocp-Apim-Subscription-Key': key}
                }, function (error, response) {
                    response.body = JSON.parse(response.body);
                    return _return(error, response, resolve, reject);
                });
            });
        }
    };

    /**
     * @namespace
     * @memberOf face
     */
    var person = {
        /**
         * Adds a face to a person for identification. The maximum face count for each person is 32.
         * The face ID must be added to a person before its expiration. Typically a face ID expires
         * 24 hours after detection.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} personId          - The target person that the face is added to.
         * @param {string} faceId            - The ID of the face to be added. The maximum face amount for each person is 32.
         * @param {string} userData          - Optional. Attach user data to person's face. The maximum length is 1024.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        addFace: function (personGroupId, personId, faceId, userData) {
            return new _Promise((resolve, reject) => {
                request.put({
                    uri: personUrl + '/' + personGroupId + '/persons/' + personId + '/faces/' + faceId,
                    headers: {'Ocp-Apim-Subscription-Key': key},
                    json: true,
                    body: userData ? {userData: userData} : {}
                }, (error, response) => _return(error, response, resolve, reject));
            });
        },

        /**
         * Deletes a face from a person.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} personId          - The target person that the face is removed from.
         * @param {string} faceId            - The ID of the face to be deleted.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        deleteFace: function (personGroupId, personId, faceId) {
            return new _Promise((resolve, reject) => {
                request({
                    method: 'DELETE',
                    uri: personUrl + '/' + personGroupId + '/persons/' + personId + '/faces/' + faceId,
                    headers: {'Ocp-Apim-Subscription-Key': key}
                }, (error, response) => _return(error, response, resolve, reject));
            });
        },

        /**
         * Updates a face for a person.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} personId          - The target person that the face is updated on.
         * @param {string} faceId            - The ID of the face to be updated.
         * @param {string} userData          - Optional. Attach user data to person's face. The maximum length is 1024.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        updateFace: function (personGroupId, personId, faceId, userData) {
            return new _Promise((resolve, reject) => {
                request.patch({
                    uri: personUrl + '/' + personGroupId + '/persons/' + personId + '/faces/' + faceId,
                    headers: {'Ocp-Apim-Subscription-Key': key},
                    json: true,
                    body: userData ? {userData: userData} : {}
                }, (error, response) => _return(error, response, resolve, reject));
            });
        },

        /**
         * Get a face for a person.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} personId          - The target person that the face is to get from.
         * @param {string} faceId            - The ID of the face to get.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        getFace: function (personGroupId, personId, faceId) {
            return new _Promise((resolve, reject) => {
                request({
                    uri: personUrl + '/' + personGroupId + '/persons/' + personId + '/faces/' + faceId,
                    headers: {'Ocp-Apim-Subscription-Key': key}
                }, (error, response) => {
                    response.body = JSON.parse(response.body);
                    _return(error, response, resolve, reject)
                });
            });
        },

        /**
         * Creates a new person in a specified person group for identification.
         * The number of persons has a subscription limit. Free subscription amount is 1000 persons.
         * The maximum face count for each person is 32.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string[]} faces           - Array of face id's for the target person
         * @param {string} name              - Target person's display name. The maximum length is 128.
         * @param {string} userData          - Optional fields for user-provided data attached to a person. Size limit is 16KB.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        create: function (personGroupId, faces, name, userData) {
            return new _Promise((resolve, reject) => {
                request.post({
                    uri: personUrl + '/' + personGroupId + '/persons',
                    headers: {'Ocp-Apim-Subscription-Key': key},
                    json: true,
                    body: {
                        faceIds: faces,
                        name: name,
                        userData: userData
                    }
                }, (error, response) => _return(error, response, resolve, reject));
            });
        },

        /**
         * Deletes an existing person from a person group.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} personId          - The target person to delete.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        delete: function (personGroupId, personId) {
            return new _Promise((resolve, reject) => {
                request({
                    method: 'DELETE',
                    uri: personUrl + '/' + personGroupId + '/persons/' + personId,
                    headers: {'Ocp-Apim-Subscription-Key': key}
                }, (error, response) => _return(error, response, resolve, reject));
            });
        },

        /**
         * Gets an existing person from a person group.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} personId          - The target person to get.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        get: function (personGroupId, personId) {
            return new _Promise((resolve, reject) => {
                request({
                    uri: personUrl + '/' + personGroupId + '/persons/' + personId,
                    headers: {'Ocp-Apim-Subscription-Key': key}
                }, (error, response) => {
                    response.body = JSON.parse(response.body);
                    _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Updates a person's information.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string[]} faces           - Array of face id's for the target person
         * @param {string} name              - Target person's display name. The maximum length is 128.
         * @param {string} userData          - Optional fields for user-provided data attached to a person. Size limit is 16KB.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        update: function (personGroupId, personId, faces, name, userData) {
            return new _Promise((resolve, reject) => {
                request.patch({
                    uri: personUrl + '/' + personGroupId + '/persons/' + personId,
                    headers: {'Ocp-Apim-Subscription-Key': key},
                    json: true,
                    body: {
                        faceIds: faces,
                        name: name,
                        userData: userData
                    }
                }, (error, response) => _return(error, response, resolve, reject));
            });
        },

        /**
         * Lists all persons in a person group, with the person information.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        list: function (personGroupId) {
            return new _Promise((resolve, reject) => {
                request({
                    uri: personUrl + '/' + personGroupId + '/persons',
                    headers: {'Ocp-Apim-Subscription-Key': key}
                }, (error, response) => {
                    response.body = JSON.parse(response.body);
                    _return(error, response, resolve, reject);
                });
            });
        }
    };

    return {
        detect: detect,
        similar: similar,
        grouping: grouping,
        identify: identify,
        verify: verify,
        personGroup: personGroup,
        person: person
    };
};

module.exports = face;
