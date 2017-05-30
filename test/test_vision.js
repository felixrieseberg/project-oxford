var assert   = require('assert'),
    _Promise = require('bluebird'),
    fs       = require('fs'),
    oxford   = require('../dist/oxford'),
    client   = new oxford.Client(process.env.OXFORD_KEY);

var harryImageBuffer = oxford.makeBuffer('data:image/jpeg;base64,' +
    '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' +
    'BbvDab5gPJgJlMBOcAVbahbm61c//9k=');

describe('Project Oxford Vision API Test', function () {
    before(function() {
        // ensure the output directory exists
        if (!fs.existsSync('./test/output')) {
            fs.mkdirSync('./test/output', 0766, function (err) {
                throw err;
            });
        }
    });

    afterEach(function() {
        // delay after each test to prevent throttling
        var now = +new Date() + 1000;
        while(now > +new Date());
    });

    it('analyzes a local image', function (done) {
        this.timeout(30000);
        client.vision.analyzeImage({
            path: './test/images/vision.jpg',
            ImageType: true,
            Color: true,
            Faces: true,
            Adult: true,
            Categories: true,
            Tags: true,
            Description: true
        })
        .then(function (response) {
            assert.ok(response);
            assert.ok(response.categories);
            assert.ok(response.adult);
            assert.ok(response.metadata);
            assert.ok(response.faces);
            assert.ok(response.color);
            assert.ok(response.imageType);
            assert.ok(response.tags);
            assert.ok(response.description);
            done();
        })
    });

    it('analyzes an online image', function (done) {
        this.timeout(30000);

        // Travis keeps having issues with this test
        // even though they run fine locally
        if (process.env.TRAVIS_CI) {
            return done();
        }

        client.vision.analyzeImage({
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Bill_Gates_June_2015.jpg',
            ImageType: true,
            Color: true,
            Faces: true,
            Adult: true,
            Categories: true,
            Tags: true,
            Description: true
        })
        .then(function (response) {
            assert.ok(response);
            assert.ok(response.categories);
            assert.ok(response.adult);
            assert.ok(response.metadata);
            assert.ok(response.faces);
            assert.ok(response.color);
            assert.ok(response.imageType);
            assert.ok(response.tags);
            assert.ok(response.description);
            done();
        });
    });

    it('analyzes a image buffer', function (done) {
        this.timeout(30000);
        client.vision.analyzeImage({
            data: harryImageBuffer,
            Faces: true
        })
        .then(function (response) {
            assert.equal(response.faces.length, 1);
            assert.equal(response.faces[0].gender, 'Male');
            assert.equal(response.metadata.format, 'Jpeg');
            done();
        })
    });

    it('creates a thumbnail for a local image', function (done) {
        this.timeout(30000);
        client.vision.thumbnail({
            path: './test/images/vision.jpg',
            pipe: fs.createWriteStream('./test/output/thumb2.jpg'),
            width: 100,
            height: 100,
            smartCropping: true
        })
        .then(function (response) {
            var stats = fs.statSync('./test/output/thumb2.jpg');
            assert.ok((stats.size > 0));
            done();
        });
    });

    it('creates a thumbnail for an online image', function (done) {
        this.timeout(30000);
        client.vision.thumbnail({
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Bill_Gates_June_2015.jpg',
            pipe: fs.createWriteStream('./test/output/thumb1.jpg'),
            width: 100,
            height: 100,
            smartCropping: true
        })
        .then(function (response) {
            var stats = fs.statSync('./test/output/thumb1.jpg');
            assert.ok((stats.size > 0));
            done();
        })
        .catch(function (error) {
            console.error(error)
        });
    });

    it('creates a thumbnail for an image buffer', function (done) {
        this.timeout(30000);
        client.vision.thumbnail({
            data: harryImageBuffer,
            pipe: fs.createWriteStream('./test/output/thumb3.jpg'),
            width: 100,
            height: 100,
            smartCropping: true
        })
        .then(function (response) {
            var stats = fs.statSync('./test/output/thumb3.jpg');
            assert.ok((stats.size > 0));
            done();
        });
    });

    it('runs OCR on a local image', function (done) {
        this.timeout(30000);
        client.vision.ocr({
            path: './test/images/vision.jpg',
            language: 'en',
            detectOrientation: true
        })
        .then(function (response) {
            assert.ok(response.language);
            assert.ok(response.regions);
            done();
        })
        .catch(function (error) {
            console.log(error)
        });
    });

    it('runs OCR on an online image', function (done) {
        this.timeout(30000);
        client.vision.ocr({
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Bill_Gates_June_2015.jpg',
            language: 'en',
            detectOrientation: true
        })
        .then(function (response) {
            assert.ok(response.language);
            assert.ok(response.orientation);
            done();
        });
    });

    it('runs OCR on an image buffer', function (done) {
        this.timeout(30000);
        client.vision.ocr({
            data: oxford.makeBuffer('data:image/jpeg;base64,' +
                '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsK' +
                'CwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQU' +
                'FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCAAyADIDAREA' +
                'AhEBAxEB/8QAHAABAAEFAQEAAAAAAAAAAAAAAAQBAwUGBwII/8QAFAEBAAAAAAAAAAAAAAAAAAAA' +
                'AP/aAAwDAQACEAMQAAAB+qQAACEeCySyQYwyxwogk42AsGGO6mqlTUyWVIZ1UAAAAAAAAAAH/8QA' +
                'HxAAAgICAgMBAAAAAAAAAAAABAUDBgACARQVIEBH/9oACAEBAAEFAvcU0c6ONgLLyG3BYb9uDtb7' +
                '6x6BtwWG+WHgyntmdehB3vKIBAo/U7tHwyb3lEAgUY/Recyw1+GwiRUsoot1Vjjn81SIZqoqWUUX' +
                '83//xAAUEQEAAAAAAAAAAAAAAAAAAABQ/9oACAEDAQE/AUf/xAAUEQEAAAAAAAAAAAAAAAAAAABQ' +
                '/9oACAECAQE/AUf/xAAwEAABAwMDAQUGBwAAAAAAAAACAQMEBRESABMxFAYhUXGREBUiMkGBICNA' +
                'coWhw//aAAgBAQAGPwL8anGfbkAi4qTRoSX8O7T6BJZNWFs7iaLt/u8NEMWbHkkPKMuoVvTXTbzf' +
                'U4bmzl8ePGVvDSkRIIp3qq/TRDFmx5JDyjLqFb09hyaWAm1WTRjaJbI3KX5T+/ffy12a7PmZHFlv' +
                'uOzDvZXzEcu/zXQVamxWoM6G62raxxwzuSIorbnnX8N/vrs9SXlVIMt5wnxRbZ4DdBXQVamxWoM6' +
                'G62raxxwzuSIorbnn2U787Z6OY3L+XLLG/w/3oG3HHGHWj3GZDS2NsvFNR3axWnaq1HPcbj7ItBk' +
                'nClbnQ1Wn1j3Y8kbplTpkdumSl9V8vTSR6pVXJcxt7eYmtNCybK27rIn39dR3axWnaq1HPcbj7It' +
                'BknClbn9P//EACMQAAEDBAIBBQAAAAAAAAAAAAEAESExQVFxEGHRIECRwfD/2gAIAQEAAT8h9Zkt' +
                'QRBV13SZxC3RiWF1JmY57Al8GFq9mUPR0Bc7mwDJKkzMc9gXFqOBiR9BBnRHaG8gZLViU6GEH6N0' +
                'mCKBBVxvhFbyQBmcFiTRB+jdJgigQVcb4/DvZIZ7p0g7HNo6E+kKX7CAFvvym5y135aEmzaU22X9' +
                'AAIJl3egKFL9hAC3359v/9oADAMBAAIAAwAAABCSSSSCAQSQSAQCSSSSSSSSSSSf/8QAFBEBAAAA' +
                'AAAAAAAAAAAAAAAAUP/aAAgBAwEBPxBH/8QAFBEBAAAAAAAAAAAAAAAAAAAAUP/aAAgBAgEBPxBH' +
                '/8QAIRABAQEAAgEDBQAAAAAAAAAAAREhADFREEHwIEBhcbH/2gAIAQEAAT8Q+uO7eR1kQFL2KcQS' +
                'hbGKgagslx8cNJEL9lRTfPPgyJD+v+xbxw0x5hVGAHu8NJEL9lRTfPpJZDNEA5IobRdBBerUeG0s' +
                'U2HaHgyr6SIwGxhURYh5LmyxqGBvDWoJoIMq+kiMBsYVEWIefL0s/nqdrzeM3IflDYrv8IIvP3Jd' +
                'wG+xjbaIerhGZSo0wFngRwAbFYCAgBF3DEi8/cl3Ab7GNtoh+2//2Q=='),
            language: 'en',
            detectOrientation: true
        })
        .then(function (response) {
            assert.equal(response.language, 'en');
            assert.equal(response.orientation, 'Up');
            assert.equal(response.regions.length, 1);
            assert.equal(response.regions[0].lines.length, 1);
            assert.equal(response.regions[0].lines[0].words.length, 1);
            assert.equal(response.regions[0].lines[0].words[0].text, 'YOLO');
            done();
        });
    });

    it('list domain-specific classifier models, find celebrities model', function (done) {
        this.timeout(30000);
        client.vision.models.list()
        .then(function (response) {
            var celeb = response.models.find(function(model) { return model.name === 'celebrities'; });
            assert.ok(celeb);
            var celebcat = celeb.categories.find(function(category) { return category === 'people_'; });
            assert.ok(celebcat);
            done();
        });
    });

    it('run celebrity classifier, recognize billg', function (done) {
        this.timeout(30000);
        client.vision.models.analyzeImage('celebrities', {
            path: './test/images/face1.jpg'
        })
        .then(function (response) {
            var celeb = response.result.celebrities[0];
            assert.equal(celeb.name, 'Bill Gates');
            assert.ok(celeb.faceRectangle);
            assert.ok(celeb.confidence);
            done();
        })
        .catch(function (error) {
            console.log(error)
        });
    });

    describe('Recognize handwriting text', function() {
        var operation = {};

        it('start a recognition request', function (done) {
            this.timeout(30000);
            client.vision.recognizeText({
                path: './test/images/written.jpg',
                handwriting: true
            })
            .then(function (response) {
                assert.ok(response);
                operation = response;
                done();
            })
            .catch(function (error) {
                console.log(error)
            });
        });

        it('checks the recognition operation status, polls until done', function (done) {
            this.slow(200000);
            this.timeout(120000);
            var waitTimeMs = 1000;
            var checkFn = function() {
                client.vision.result.get(operation)
                .then(function (response) {
                    assert.ok(response.status);
                    if (response.status === 'Succeeded') {
                        assert.equal(2, response.recognitionResult.lines.length);
                        assert.equal("You must be the change", response.recognitionResult.lines[0].text);
                        assert.equal("you want to see in the world !", response.recognitionResult.lines[1].text);
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
    })
});
