var assert   = require('assert'),
    _Promise = require('bluebird'),
    oxford   = require('../dist/oxford'),
    client   = new oxford.Client(process.env.OXFORD_KEY);

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
