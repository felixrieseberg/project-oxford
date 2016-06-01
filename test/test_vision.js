var assert   = require('assert'),
    _Promise = require('bluebird'),
    fs       = require('fs'),
    oxford   = require('../dist/oxford'),
    client   = new oxford.Client(process.env.OXFORD_KEY);

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
});
