var assert   = require('assert'),
    _Promise = require('bluebird'),
    uuid     = require('uuid'),
    fs       = require('fs'),
    oxford   = require('../dist/oxford'),
    client   = new oxford.Client(process.env.OXFORD_KEY);

// Store variables, no point in calling the api too often
var billFaces = [],
    billPersistedFaces = [],
    personGroupId = uuid.v4(),
    personGroupId2 = uuid.v4(),
    personFaceListId = uuid.v4(),
    subValid = true,
    billPersonId,
    billPersonPersistedFaceId;
 
describe('Project Oxford Face API Test', function () {
    afterEach(function() {
        // delay after each test to prevent throttling
        var now = +new Date() + 1000;
        while(now > +new Date());
    });

    describe('#detect()', function () {
        it('detects a face in a local file', function (done) {
            this.timeout(30000);
            client.face.detect({
                path: './test/images/face1.jpg',
                returnFaceId: true,
                analyzesFaceLandmarks: true,
                analyzesAge: true,
                analyzesGender: true,
                analyzesHeadPose: true
            }).then(function (response) {
                assert.ok(response[0].faceId);
                assert.ok(response[0].faceRectangle);
                assert.ok(response[0].faceLandmarks);
                assert.ok(response[0].faceAttributes.gender);
                assert.ok(response[0].faceAttributes.headPose);

                assert.equal(response[0].faceAttributes.gender, 'male');
                done();
            }).catch(function (error) {
                // Check if subscription is valid
                if (error.statusCode === 403 || error.message === 'Subscription Expired!' || error.message.indexOf('invalid subscription key')) {
                    console.error('Subscription key is not valid, all tests will fail!');
                    console.log(error);
                    return process.exit(1);
                }
                
                // throw error;
            });
        });

        it('detects a face in a remote file', function (done) {
            this.timeout(30000);
            client.face.detect({
                url: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Bill_Gates_June_2015.jpg',
                returnFaceId: true,
                analyzesFaceLandmarks: true,
                analyzesAge: true,
                analyzesFacialHair: true,
                analyzesGender: true,
                analyzesHeadPose: true,
                analyzesSmile: true
            }).then(function (response) {
                assert.ok(response[0].faceId);
                assert.ok(response[0].faceRectangle);
                assert.ok(response[0].faceLandmarks);
                assert.ok(response[0].faceAttributes.gender);
                assert.ok(response[0].faceAttributes.headPose);

                assert.equal(response[0].faceAttributes.gender, 'male');
                assert.ok(response[0].faceAttributes.smile > 0.5);
                assert.ok(response[0].faceAttributes.facialHair.beard < 0.1);
                done();
            });
        });
    });
    
    describe('#similar()', function () {
        it('detects similar faces', function (done) {
            var detects = [];

            this.timeout(30000);

            detects.push(client.face.detect({
                    path: './test/images/face1.jpg',
                    returnFaceId: true
                }).then(function(response) {
                    assert.ok(response[0].faceId);
                    billFaces.push(response[0].faceId);
                })
            );

            detects.push(client.face.detect({
                    path: './test/images/face2.jpg',
                    returnFaceId: true
                }).then(function(response) {
                    assert.ok(response[0].faceId);
                    billFaces.push(response[0].faceId);
                })
            );

            _Promise.all(detects).then(function() {
                client.face.similar(billFaces[0], {
                    candidateFaces: [billFaces[1]]
                }).then(function(response) {
                    assert.equal(response[0].faceId, billFaces[1]);
                    assert.ok(response[0].confidence > 0.5);
                    done();
                });
            });
        });
    });

    describe('#grouping()', function () {
        it('detects groups faces', function (done) {
            var faceIds = [];

            this.timeout(30000);

            client.face.detect({
                path: './test/images/face-group.jpg',
                returnFaceId: true
            }).then(function(response) {
                response.forEach(function (face) {
                    faceIds.push(face.faceId);
                });

                assert.equal(faceIds.length, 6);
            }).then(function() {
                client.face.grouping(faceIds).then(function (response) {
                    assert.ok(response.messyGroup);
                    done();
                });
            });
        });
    });

    describe('#verify()', function () {
        it('verifies a face against another face', function (done) {
            this.timeout(30000);

            assert.equal(billFaces.length, 2);

            client.face.verify(billFaces).then(function (response) {
                assert.ok(response);
                assert.ok((response.isIdentical === true || response.isIdentical === false));
                assert.ok(response.confidence);
                done();
            });
        });
    });
    
    describe('#faceList', function () {
        before(function(done) {
            this.timeout(5000);
            // Remove old face lists.
            client.face.faceList.list().then(function (response) {
                var promises = [];

                response.forEach(function (faceList) {
                    if (faceList.name.indexOf('po-node-test-face') > -1) {
                        promises.push(client.face.faceList.delete(faceList.faceListId));
                    }
                });

                _Promise.all(promises).then(function () {
                    done();
                });
            });
        });

        it('creates a face list', function (done) {
            client.face.faceList.create(personFaceListId, {
                name: 'po-node-test-face',
                userData: 'test-data' })
            .then(function (response) {
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
        
        it('adds two face to the face list', function (done) {
            this.timeout(10000);
            var adds = [];
            
            adds.push(client.face.faceList.addFace(personFaceListId, {
                    path: './test/images/face1.jpg',
                    name: 'bill-face-1'})
                .then(function (response) {
                    billPersistedFaces.push(response.persistedFaceId);
                })
                .catch(function (error) {
                    assert.ok(false, JSON.stringify(error));
                }));
                
            adds.push(client.face.faceList.addFace(personFaceListId, {
                    url: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Bill_Gates_June_2015.jpg',
                    name: 'bill-face-2'})
                .then(function (response) {
                    billPersistedFaces.push(response.persistedFaceId);
                })
                .catch(function (error) {
                    assert.ok(false, JSON.stringify(error));
                }));
                
            _Promise.all(adds).then(function () {
                done();
            })
        });
        
        it('removes one face from the face list', function (done) {
            assert.equal(billPersistedFaces.length, 2);
            var persistedFaceId = billPersistedFaces.pop();
            client.face.faceList.deleteFace(personFaceListId, persistedFaceId)
            .then(function (response) {
                assert.ok(true, "void response expected");
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
        
        it('retrieves the face list', function (done) {
            client.face.faceList.get(personFaceListId)
            .then(function (response) {
                assert.equal(personFaceListId, response.faceListId);
                assert.equal(response.name, 'po-node-test-face');
                assert.equal(response.userData, 'test-data');
                assert.equal(response.persistedFaces.length, 1);
                assert.equal(response.persistedFaces[0].persistedFaceId, billPersistedFaces[0]);
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
        
        it('invokes #similar using the face list', function (done) {
            client.face.similar(billFaces[0], {
                candidateFaceListId: personFaceListId
            })
            .then(function (response) {
                assert.equal(response.length, 1);
                assert.equal(response[0].persistedFaceId, billPersistedFaces[0]);
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
    });
    
    describe('#PersonGroup', function () {
        before(function(done) {
            this.timeout(5000);
            // In order to test the
            // training feature, we have to start training - sadly, we can't
            // delete the group then. So we clean up before we run tests - and to wait
            // for cleanup to finish, we're just using done().
            client.face.personGroup.list().then(function (response) {
                var promises = [];

                response.forEach(function (personGroup) {
                    if (personGroup.name.indexOf('po-node-test-group') > -1) {
                        promises.push(client.face.personGroup.delete(personGroup.personGroupId));
                    }
                });

                _Promise.all(promises).then(function () {
                    done();
                });
            });
        });

        it('creates a PersonGroup', function (done) {
            client.face.personGroup.create(personGroupId, 'po-node-test-group', 'test-data')
            .then(function (response) {
                assert.ok(true, "void response expected");
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('lists PersonGroups', function (done) {
            client.face.personGroup.list()
            .then(function (response) {
                assert.ok(response);
                assert.ok((response.length > 0));
                assert.ok(response[0].personGroupId);
                done();
            });
        });

        it('gets a PersonGroup', function (done) {
            client.face.personGroup.get(personGroupId)
            .then(function (response) {
                assert.equal(response.personGroupId, personGroupId);
                assert.equal(response.name, 'po-node-test-group');
                assert.equal(response.userData, 'test-data');
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
        
        it('updates a PersonGroup', function (done) {
            client.face.personGroup.update(personGroupId, 'po-node-test-group2', 'test-data2')
            .then(function (response) {
                assert.ok(true, "void response expected");;
                done();
            }).catch(function (response) {
                assert.equal(response, 'PersonGroupTrainingNotFinished')
            });
        });

        it('gets a PersonGroup\'s training status', function (done) {
            client.face.personGroup.trainingStatus(personGroupId)
            .then(function (response) {
                assert.equal(response.personGroupId, personGroupId);
                assert.equal(response.status, 'notstarted');
                done();
            })
            .catch(function (error) {
                assert.equal(error.code, 'PersonGroupNotTrained');
                done();
            });
        });

        it('starts a PersonGroup\'s training', function (done) {
            client.face.personGroup.trainingStart(personGroupId)
            .then(function (response) {
                assert.ok(true, "void response expected");;
                done();
            }).catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('deletes a PersonGroup', function (done) {
            client.face.personGroup.delete(personGroupId)
            .then(function (response) {
                assert.ok(!response, "void response");
                done();
            }).catch(function (response) {
                assert.equal(JSON.parse(response).error.code, 'PersonGroupTrainingNotFinished');
                done();
            });
        });
    });

    describe('#Person', function () {

        it('creates a PersonGroup for the Person', function (done) {
            client.face.personGroup.create(personGroupId2, 'po-node-test-group', 'test-data')
            .then(function (response) {
                assert.ok(true, "void response expected");
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('creates a Person', function (done) {
            client.face.person.create(personGroupId2, 'test-bill', 'test-data')
            .then(function (response) {
                assert.ok(response.personId);
                billPersonId = response.personId;
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('gets a Person', function (done) {
            client.face.person.get(personGroupId2, billPersonId)
            .then(function (response) {
                assert.equal(response.personId, billPersonId);
                assert.equal(response.name, 'test-bill');
                assert.equal(response.userData, 'test-data');
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('updates a Person', function (done) {
            client.face.person.update(personGroupId2, billPersonId, 'test-bill2', 'test-data2')
            .then(function (response) {
                assert.ok(true, "void response expected");
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('adds a face to a Person', function (done) {
            client.face.person.addFace(personGroupId2, billPersonId, {
                path: './test/images/face1.jpg',
                userData: 'test-data-face'
            })
            .then(function (response) {
                billPersonPersistedFaceId = response.persistedFaceId;
                assert.ok(billPersonPersistedFaceId);
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('gets a face from a Person', function (done) {
            client.face.person.getFace(personGroupId2, billPersonId, billPersonPersistedFaceId)
            .then(function (response) {
                assert.equal(response.persistedFaceId, billPersonPersistedFaceId);
                assert.equal(response.userData, 'test-data-face');
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('updates a face on a Person', function (done) {
            client.face.person.updateFace(personGroupId2, billPersonId, billPersonPersistedFaceId, 'test-data-face-updated')
            .then(function (response) {
                assert.ok(true, "void response expected");
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('deletes a face on a Person', function (done) {
            client.face.person.deleteFace(personGroupId2, billPersonId, billPersonPersistedFaceId)
            .then(function (response) {
                assert.ok(true, "void response expected");
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('lists Persons', function (done) {
            client.face.person.list(personGroupId2)
            .then(function (response) {
                assert.equal(response.length, 1);
                assert.equal(response[0].personId, billPersonId);
                assert.equal(response[0].name, 'test-bill2');
                assert.equal(response[0].userData, 'test-data2');
                assert.ok(!response[0].persistedFaceIds || response[0].persistedFaceIds.length == 0);
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('deletes a Person', function (done) {
            client.face.person.delete(personGroupId2, billPersonId)
            .then(function (response) {
                assert.ok(true, "void response expected");
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
    });
});

describe('Project Oxford Emotion API Test', function () {
    it('analyzes a local image', function (done) {
        this.timeout(30000);
        client.emotion.analyzeEmotion({
            path: './test/images/face2.jpg'
        })
        .then(function (response) {
            assert.ok(response);
            assert.equal(response.length, 1);
            assert.ok(response[0].faceRectangle);
            var highestEmotion;
            var highestScore = 0;
            for (var emotion in response[0].scores) {
                var score = response[0].scores[emotion];
                if (score > highestScore) {
                    highestScore = score;
                    highestEmotion = emotion;
                }
            }
            assert.equal(highestEmotion, 'happiness');
            done();
        })
    });

    it('analyzes an online image', function (done) {
        this.timeout(30000);
        client.emotion.analyzeEmotion({
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Crying-girl.jpg/640px-Crying-girl.jpg',
            faceRectangles: [{left: 167, top: 163, width: 224, height: 224}]
        })
        .then(function (response) {
            assert.ok(response);
            assert.equal(response.length, 1);
            assert.ok(response[0].faceRectangle);
            assert.ok(response[0].scores.sadness > 0.98);
            done();
        })
    });
});