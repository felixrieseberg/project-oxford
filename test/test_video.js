var assert = require('assert'),
    _Promise = require('bluebird'),
    uuid = require('uuid'),
    fs = require('fs'),
    oxford = require('../dist/oxford'),
    client = new oxford.Client(process.env.OXFORD_KEY);

describe('Project Oxford Video API Test', function () {
    before(function() {
        // ensure the output directory exists
        if(!fs.existsSync('./test/output')){
            fs.mkdirSync('./test/output', 0766, function(err){
                throw err;
            });
        }
    });

    describe('#stabilize()', function () {
        var operation = {};
        var resourceLocation = '';
        it('uploads a local video for stabilization', function (done) {
            this.timeout(30000);
            client.video.stabilize({
                path: './test/videos/blank.mp4'
            }).then(function (response) {
                assert.ok(response);
                operation = response;
                done();
            }).catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('checks the operation status, polls until done', function (done) {
            this.slow();
            this.timeout(120000);
            var waitTimeMs = 1000;
            var checkFn = function() {
                client.video.result.get(operation)
                .then(function (response) {
                    assert.ok(response.status);
                    assert.ok(response.createdDateTime);
                    assert.ok(response.lastActionDateTime);
                    if (response.status === 'Succeeded') {
                        resourceLocation = response.resourceLocation;
                        done();
                    } else if (response.status === 'Failed') {
                        assert.ok(false);
                        done();
                    } else {
                        waitTimeMs *= 1.8;
                        setTimeout(checkFn, waitTimeMs);
                    }
                });
            };

            setTimeout(checkFn, waitTimeMs);
        });

        it('gets the stabilized video', function (done) {
            this.slow();
            client.video.result.getVideo(resourceLocation, fs.createWriteStream('./test/output/out.mp4'))
            .then(function (response) {
                var stats = fs.statSync('./test/output/out.mp4');
                assert.ok((stats.size > 0));
                done();
            })
            .catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
    });

    describe('#detectMotion()', function () {
        var operation = {};
        it('uploads a local video for motion detection', function (done) {
            this.timeout(30000);
            client.video.detectMotion({
                path: './test/videos/blank.mp4'
            }).then(function (response) {
                assert.ok(response);
                operation = response;
                done();
            }).catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('checks the operation status, polls until done', function (done) {
            // 20-second video; it is blank so no motion is expected
            this.timeout(120000);
            var waitTimeMs = 1000;
            var VIDEO_DURATION_SECS = 20;
            var checkFn = function() {
                client.video.result.get(operation)
                .then(function (response) {
                    assert.ok(response.status);
                    assert.ok(response.createdDateTime);
                    assert.ok(response.lastActionDateTime);
                    if (response.status === 'Succeeded') {
                        motion = JSON.parse(response.processingResult);
                        assert.equal(motion.version, 1);
                        assert.equal(motion.width, 640);
                        assert.equal(motion.height, 480);
                        assert.equal(motion.offset, 0);
                        assert.equal(motion.regions.length, 1);
                        assert.equal(motion.regions[0].id, 0);
                        assert.equal(motion.regions[0].type, 'rectangle');
                        assert.equal(motion.regions[0].x, 0);
                        assert.equal(motion.regions[0].y, 0);
                        assert.equal(motion.regions[0].width, 1);
                        assert.equal(motion.regions[0].height, 1);
                        assert.equal(motion.fragments.length, 1);
                        assert.equal(motion.fragments[0].start, 0);
                        assert.equal(motion.fragments[0].duration, VIDEO_DURATION_SECS * motion.timescale);
                        assert.equal(motion.fragments[0].interval, undefined);
                        assert.equal(motion.fragments[0].events, undefined);
                        done();
                    } else if (response.status === 'Failed') {
                        assert.ok(false);
                        done();
                    } else {
                        waitTimeMs *= 1.8;
                        setTimeout(checkFn, waitTimeMs);
                    }
                });
            };

            setTimeout(checkFn, waitTimeMs);
        });
    });
});