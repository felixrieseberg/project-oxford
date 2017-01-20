'use strict';

var request = require('request').defaults({
    headers: { 'User-Agent': 'nodejs/0.4.0' } }),
    fs = require('fs'),
    _Promise = require('bluebird');

var rootPath = '/face/v1.0';
var detectPath = '/detect';
var similarPath = '/findsimilars';
var groupingPath = '/group';
var identifyPath = '/identify';
var verifyPath = '/verify';
var personGroupPath = '/persongroups';
var personPath = '/persongroups';
var faceListPath = '/facelists';

/**
 * @namespace
 * @memberof Client
 */
var face = function face(key, host) {
    /**
     * @private
     */
    function _return(error, response, resolve, reject) {
        if (error) {
            return reject(error);
        }

        if (response.statusCode !== 200 && response.statusCode !== 202) {
            reject(response.body.error || response.body);
        }

        return resolve(response.body);
    }

    /**
     * (Private) Post an online image to a face API URL
     *
     * @private
     * @param  {string} url         - Url to POST
     * @param  {string} image       - Url to the image
     * @param  {object} options     - Querystring object
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
     * (Private) Post a local image file to a face API URL
     *
     * @private
     * @param  {string} url         - Url to POST
     * @param  {string} image       - Path to the image
     * @param  {object} options     - Querystring object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _postImageSync(url, image, options) {
        return new _Promise(function (resolve, reject) {
            request.post({
                uri: host + rootPath + url,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/octet-stream'
                },
                qs: options,
                body: fs.readFileSync(image)
            }, function (error, response) {
                response.body = JSON.parse(response.body);
                _return(error, response, resolve, reject);
            });
        });
    }
    function _postLocal(url, image, options) {
        return _postImageSync(url, image, options);
    }

    /**
     * (Private) Post an online image to a face API URL
     *
     * @private
     * @param  {string} url         - Url to POST
     * @param  {string} buffer      - Buffer containing image
     * @param  {object} options     - Querystring object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _postBuffer(url, buffer, options) {
        return new _Promise(function (resolve, reject) {
            request.post({
                uri: host + rootPath + url,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/octet-stream' },
                body: buffer,
                qs: options
            }, function (error, response) {
                response.body = JSON.parse(response.body);
                _return(error, response, resolve, reject);
            });
        });
    }

    /**
     * (Private)  Post an image to a face API URL.
     *
     * @private
     * @param  {string} url           - URL to post
     * @param  {object} source        - Union of sources
     * @param  {string} source.url    - URL of image
     * @param  {string} source.path   - Local path of image
     * @param  {object} qs            - Querystring object
     * @return {Promise}              - Promise resolving with the resulting JSON
     */
    function _postImage(url, source, qs) {
        if (source.url && source.url !== '') {
            return _postOnline(url, source.url, qs);
        }
        if (source.path && source.path !== '') {
            return _postLocal(url, source.path, qs);
        }
        if (source.data && source.data !== '') {
            return _postBuffer(url, source.data, qs);
        }
    }

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
     * @param  {string}  options.data                   - Image as a binary buffer
     * @param  {boolean} options.returnFaceId           - Include face ID in response?
     * @param  {boolean} options.analyzesFaceLandmarks  - Analyze face landmarks?
     * @param  {boolean} options.analyzesAge            - Analyze age?
     * @param  {boolean} options.analyzesGender         - Analyze gender?
     * @param  {boolean} options.analyzesHeadPose       - Analyze headpose?
     * @param  {boolean} options.analyzesSmile          - Analyze smile?
     * @param  {boolean} options.analyzesFacialHair     - Analyze facial hair?
     * @return {Promise}                                - Promise resolving with the resulting JSON
     */
    function detect(options) {
        var attributes = [];
        if (options.analyzesAge) {
            attributes.push('age');
        }
        if (options.analyzesGender) {
            attributes.push('gender');
        }
        if (options.analyzesHeadPose) {
            attributes.push('headPose');
        }
        if (options.analyzesSmile) {
            attributes.push('smile');
        }
        if (options.analyzesFacialHair) {
            attributes.push('facialHair');
        }
        var qs = {
            returnFaceId: !!options.returnFaceId,
            returnFaceLandmarks: !!options.analyzesFaceLandmarks,
            returnFaceAttributes: attributes.join()
        };

        return _postImage(detectPath, options, qs);
    }

    /**
     * Detect similar faces using faceIds (as returned from the detect API), or faceListId
     * (as returned from the facelist API).
     * @param  {string}   sourceFace                  - String of faceId for the source face
     * @param  {object}   options                     - Options object
     * @param  {string[]} options.candidateFaces      - Array of faceIds to use as candidates
     * @param  {string}   options.candidateFaceListId - Id of face list, created via FaceList.create
     * @param  {Number}   options.maxCandidates       - Optional max number for top candidates (default is 20, max is 20)
     * @return {Promise}                              - Promise resolving with the resulting JSON
     */
    function similar(sourceFace, options) {
        return new _Promise(function (resolve, reject) {
            var faces = {
                faceId: sourceFace
            };
            if (options) {
                if (options.candidateFaceListId) {
                    faces.faceListId = options.candidateFaceListId;
                } else {
                    faces.faceIds = options.candidateFaces;
                }
                if (options.maxCandidates) {
                    faces.maxNumOfCandidatesReturned = options.maxCandidates;
                }
            }
            request.post({
                uri: host + rootPath + similarPath,
                headers: { 'Ocp-Apim-Subscription-Key': key },
                json: true,
                body: faces
            }, function (error, response) {
                return _return(error, response, resolve, reject);
            });
        });
    }

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
                faces = { faceIds: faces };
            }

            request.post({
                uri: host + rootPath + groupingPath,
                headers: { 'Ocp-Apim-Subscription-Key': key },
                json: true,
                body: faces
            }, function (error, response) {
                return _return(error, response, resolve, reject);
            });
        });
    }

    /**
     * Identifies persons from a person group by one or more input faces.
     * To recognize which person a face belongs to, Face Identification needs a person group
     * that contains number of persons. Each person contains one or more faces. After a person
     * group prepared, it should be trained to make it ready for identification. Then the
     * identification API compares the input face to those persons' faces in person group and
     * returns the best-matched candidate persons, ranked by confidence.
     *
     * @param  {string[]} faces                     - Array of faceIds to use
     * @param  {string} personGroupId               - Id of person group from which faces will be identified
     * @param  {Number} maxNumOfCandidatesReturned  - Optional max number of candidates per face (default=1, max=5)
     * @return {Promise}                            - Promise resolving with the resulting JSON
     */
    function identify(faces, personGroupId, maxNumOfCandidatesReturned) {
        return new _Promise(function (resolve, reject) {
            var body = {
                faceIds: faces,
                personGroupId: personGroupId,
                maxNumOfCandidatesReturned: maxNumOfCandidatesReturned || 1
            };

            request.post({
                uri: host + rootPath + identifyPath,
                headers: { 'Ocp-Apim-Subscription-Key': key },
                json: true,
                body: body
            }, function (error, response) {
                return _return(error, response, resolve, reject);
            });
        });
    }

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
                var body = {
                    faceId1: faces[0],
                    faceId2: faces[1]
                };

                request.post({
                    uri: host + rootPath + verifyPath,
                    headers: { 'Ocp-Apim-Subscription-Key': key },
                    json: true,
                    body: body
                }, function (error, response) {
                    return _return(error, response, resolve, reject);
                });
            } else {
                return reject('Faces array must contain two face ids');
            }
        });
    }

    /**
     * @namespace
     * @memberof Client.face
     */
    var faceList = {
        /**
         * Lists the faceListIds, and associated names and/or userData.
         * @return {Promise} - Promise resolving with the resulting JSON
         */
        list: function list() {
            return new _Promise(function (resolve, reject) {
                request({
                    uri: host + rootPath + faceListPath,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
                    response.body = JSON.parse(response.body);
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Creates a new face list with a user-specified ID.
         * A face list is a list of faces associated to be associated with a given person.
         *
         * @param  {string} faceListId          - Numbers, en-us letters in lower case, '-', '_'. Max length: 64
         * @param  {object} options             - Optional parameters
         * @param  {string} options.name        - Name of the face List
         * @param  {string} options.userData    - User-provided data associated with the face list.
         * @return {Promise}                    - Promise resolving with the resulting JSON
         */
        create: function create(faceListId, options) {
            var body = {};
            if (options) {
                body.name = options.name;
                body.userData = options.userData;
            }
            return new _Promise(function (resolve, reject) {
                request.put({
                    uri: host + rootPath + faceListPath + '/' + faceListId,
                    headers: { 'Ocp-Apim-Subscription-Key': key },
                    json: true,
                    body: body
                }, function (error, response) {
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Creates a new person group with a user-specified ID.
         * A person group is one of the most important parameters for the Identification API.
         * The Identification searches person faces in a specified person group.
         *
         * @param  {string} faceListId          - Numbers, en-us letters in lower case, '-', '_'. Max length: 64
         * @param  {object} options             - Optional parameters
         * @param  {string} options.name        - Name of the face List
         * @param  {string} options.userData    - User-provided data associated with the face list.
         * @return {Promise}                    - Promise resolving with the resulting JSON
         */
        update: function update(faceListId, options) {
            var body = {};
            if (options) {
                body.name = options.name;
                body.userData = options.userData;
            }
            return new _Promise(function (resolve, reject) {
                request.patch({
                    uri: host + rootPath + faceListPath + '/' + faceListId,
                    headers: { 'Ocp-Apim-Subscription-Key': key },
                    json: true,
                    body: body
                }, function (error, response) {
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Deletes an existing person group.
         *
         * @param  {string} faceListId          - ID of face list to delete
         * @return {Promise}                    - Promise resolving with the resulting JSON
         */
        'delete': function _delete(faceListId) {
            return new _Promise(function (resolve, reject) {
                request({
                    method: 'DELETE',
                    uri: host + rootPath + faceListPath + '/' + faceListId,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Gets an existing face list.
         *
         * @param  {string} faceListId          - ID of face list to retrieve
         * @return {Promise}                    - Promise resolving with the resulting JSON
         */
        get: function get(faceListId) {
            return new _Promise(function (resolve, reject) {
                request({
                    uri: host + rootPath + faceListPath + '/' + faceListId,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
                    response.body = JSON.parse(response.body);
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Gets an existing face list.
         *
         * @param  {string} faceListId          - ID of face list to retrieve
         * @param  {object} options             - Options object
         * @param  {string} options.url         - URL to image to be used
         * @param  {string} options.path        - Path to image to be used
         * @param  {string} options.data        - Image as a binary buffer
         * @param  {string} options.name        - Optional name for the face
         * @param  {string} options.userData    - Optional user-data for the face
         * @param  {string} options.targetFace  - Optional face rectangle to specify the target face to be added into the face list, in the format of "targetFace=left,top,width,height".
         * @return {Promise}                    - Promise resolving with the resulting JSON
         */
        addFace: function addFace(faceListId, options) {
            var url = faceListPath + '/' + faceListId + '/persistedFaces';
            var qs = {};
            if (options) {
                qs.name = options.name;
                qs.userData = options.userData;
                qs.targetFace = options.targetFace;
            }
            return _postImage(url, options, qs);
        },

        /**
         * Delete a face from the face list.  The face ID will be an ID returned in the addFace method,
         * not from the detect method.
         *
         * @param  {string} faceListId          - ID of face list to retrieve
         * @param  {string} persistedFaceId     - ID of face in the face list
         * @return {Promise}                    - Promise; successful response is empty
         */
        deleteFace: function deleteFace(faceListId, persistedFaceId) {
            return new _Promise(function (resolve, reject) {
                request({
                    method: 'DELETE',
                    uri: host + rootPath + faceListPath + '/' + faceListId + '/persistedFaces/' + persistedFaceId,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
                    return _return(error, response, resolve, reject);
                });
            });
        }
    };

    /**
     * @namespace
     * @memberof Client.face
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
        create: function create(personGroupId, name, userData) {
            return new _Promise(function (resolve, reject) {
                request.put({
                    uri: host + rootPath + personGroupPath + '/' + personGroupId,
                    headers: { 'Ocp-Apim-Subscription-Key': key },
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
        'delete': function _delete(personGroupId) {
            return new _Promise(function (resolve, reject) {
                request({
                    method: 'DELETE',
                    uri: host + rootPath + personGroupPath + '/' + personGroupId,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
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
        get: function get(personGroupId) {
            return new _Promise(function (resolve, reject) {
                request({
                    uri: host + rootPath + personGroupPath + '/' + personGroupId,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
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
        trainingStatus: function trainingStatus(personGroupId) {
            return new _Promise(function (resolve, reject) {
                request({
                    uri: host + rootPath + personGroupPath + '/' + personGroupId + '/training',
                    headers: { 'Ocp-Apim-Subscription-Key': key }
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
        trainingStart: function trainingStart(personGroupId) {
            return new _Promise(function (resolve, reject) {
                request.post({
                    uri: host + rootPath + personGroupPath + '/' + personGroupId + '/train',
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
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
        update: function update(personGroupId, name, userData) {
            return new _Promise(function (resolve, reject) {
                request.patch({
                    uri: host + rootPath + personGroupPath + '/' + personGroupId,
                    headers: { 'Ocp-Apim-Subscription-Key': key },
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
        list: function list() {
            return new _Promise(function (resolve, reject) {
                request({
                    uri: host + rootPath + personGroupPath,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
                    response.body = JSON.parse(response.body);
                    return _return(error, response, resolve, reject);
                });
            });
        }
    };

    /**
     * @namespace
     * @memberof Client.face
     */
    var person = {
        /**
         * Adds a face to a person for identification. The maximum face count for each person is 248.
         *
         * @param {string} personGroupId       - The target person's person group.
         * @param {string} personId            - The target person that the face is added to.
         * @param {object} options             - The source specification.
         * @param {string} options.url         - URL to image to be used.
         * @param {string} options.path        - Path to image to be used.
         * @param {string} options.data        - Image as a binary buffer
         * @param {string} options.userData    - Optional. Attach user data to person's face. The maximum length is 1024.
         * @param {object} options.targetFace  - Optional. The rectangle of the face in the image.
         * @return {Promise}                   - Promise resolving with the resulting JSON
         */
        addFace: function addFace(personGroupId, personId, options) {
            var qs = {};
            if (options) {
                qs.userData = options.userData;
                if (options.targetFace) {
                    qs.targetFace = [options.targetFace.left, options.targetFace.top, options.targetFace.width, options.targetFace.height].join();
                }
            }
            var url = personPath + '/' + personGroupId + '/persons/' + personId + '/persistedFaces';
            return _postImage(url, options, qs);
        },

        /**
         * Deletes a face from a person.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} personId          - The target person that the face is removed from.
         * @param {string} persistedFaceId   - The ID of the face to be deleted.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        deleteFace: function deleteFace(personGroupId, personId, persistedFaceId) {
            return new _Promise(function (resolve, reject) {
                request({
                    method: 'DELETE',
                    uri: host + rootPath + personPath + '/' + personGroupId + '/persons/' + personId + '/persistedFaces/' + persistedFaceId,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Updates a face for a person.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} personId          - The target person that the face is updated on.
         * @param {string} persistedFaceId   - The ID of the face to be updated.
         * @param {string} userData          - Optional. Attach user data to person's face. The maximum length is 1024.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        updateFace: function updateFace(personGroupId, personId, persistedFaceId, userData) {
            return new _Promise(function (resolve, reject) {
                request.patch({
                    uri: host + rootPath + personPath + '/' + personGroupId + '/persons/' + personId + '/persistedFaces/' + persistedFaceId,
                    headers: { 'Ocp-Apim-Subscription-Key': key },
                    json: true,
                    body: userData ? { userData: userData } : {}
                }, function (error, response) {
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Get a face for a person.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} personId          - The target person that the face is to get from.
         * @param {string} persistedFaceId   - The ID of the face to get.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        getFace: function getFace(personGroupId, personId, persistedFaceId) {
            return new _Promise(function (resolve, reject) {
                request({
                    uri: host + rootPath + personPath + '/' + personGroupId + '/persons/' + personId + '/persistedFaces/' + persistedFaceId,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
                    response.body = JSON.parse(response.body);
                    _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Creates a new person in a specified person group for identification.
         * The number of persons has a subscription limit. Free subscription amount is 1000 persons.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} name              - Target person's display name. The maximum length is 128.
         * @param {string} userData          - Optional fields for user-provided data attached to a person. Size limit is 16KB.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        create: function create(personGroupId, name, userData) {
            return new _Promise(function (resolve, reject) {
                request.post({
                    uri: host + rootPath + personPath + '/' + personGroupId + '/persons',
                    headers: { 'Ocp-Apim-Subscription-Key': key },
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
         * Deletes an existing person from a person group.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} personId          - The target person to delete.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        'delete': function _delete(personGroupId, personId) {
            return new _Promise(function (resolve, reject) {
                request({
                    method: 'DELETE',
                    uri: host + rootPath + personPath + '/' + personGroupId + '/persons/' + personId,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
                    return _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Gets an existing person from a person group.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} personId          - The target person to get.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        get: function get(personGroupId, personId) {
            return new _Promise(function (resolve, reject) {
                request({
                    uri: host + rootPath + personPath + '/' + personGroupId + '/persons/' + personId,
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
                    response.body = JSON.parse(response.body);
                    _return(error, response, resolve, reject);
                });
            });
        },

        /**
         * Updates a person's information.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @param {string} personId          - The target person's id.
         * @param {string} name              - Target person's display name. The maximum length is 128.
         * @param {string} userData          - Optional fields for user-provided data attached to a person. Size limit is 16KB.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        update: function update(personGroupId, personId, name, userData) {
            return new _Promise(function (resolve, reject) {
                request.patch({
                    uri: host + rootPath + personPath + '/' + personGroupId + '/persons/' + personId,
                    headers: { 'Ocp-Apim-Subscription-Key': key },
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
         * Lists all persons in a person group, with the person information.
         *
         * @param {string} personGroupId     - The target person's person group.
         * @return {Promise}                 - Promise resolving with the resulting JSON
         */
        list: function list(personGroupId) {
            return new _Promise(function (resolve, reject) {
                request({
                    uri: host + rootPath + personPath + '/' + personGroupId + '/persons',
                    headers: { 'Ocp-Apim-Subscription-Key': key }
                }, function (error, response) {
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
        faceList: faceList,
        personGroup: personGroup,
        person: person
    };
};

module.exports = face;
