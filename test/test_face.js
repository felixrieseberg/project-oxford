var assert   = require('assert'),
    _Promise = require('bluebird'),
    uuid     = require('uuid'),
    http     = require('http'),
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
    this.timeout(10000);

    afterEach(function() {
        // delay after each test to prevent throttling.
        var now = +new Date() + 6000;
        while(now > +new Date());
    });

    describe('#detect()', function () {
        it('detects a face in a local file', function (done) {
            client.face.detect({
                path: './test/images/face1.jpg',
                returnFaceId: true,
                analyzesFaceLandmarks: true,
                analyzesAge: true,
                analyzesGender: true,
                analyzesHeadPose: true,
                analyzesGlasses: true,
                analyzesEmotion: true
            }).then(function (response) {
                assert.ok(response[0].faceId);
                assert.ok(response[0].faceRectangle);
                assert.ok(response[0].faceLandmarks);
                assert.ok(response[0].faceAttributes.gender);
                assert.ok(response[0].faceAttributes.headPose);

                assert.equal(response[0].faceAttributes.gender, 'male');
                assert.equal(response[0].faceAttributes.glasses, 'ReadingGlasses');

                assert.ok(response[0].faceAttributes.emotion.happiness > 0.5);

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

        it('detects a face in a base64-encoded blob', function (done) {
            client.face.detect({
                data: oxford.makeBuffer('data:image/jpeg;base64,' +
                    '/9j/4AAQSkZJRgABAQEASABIAAD/4ShARXhpZgAASUkqAAgAAAALAA8BAgAGAAAAkgAAABIBAwAB' +
                    'AAAAAQAAABoBBQABAAAAmAAAABsBBQABAAAAoAAAACgBAwABAAAAAgAAADIBAgAUAAAAqAAAADsB' +
                    'AgAJAAAAvAAAABMCAwABAAAAAgAAAJiCAgABAAAAAAAAAGmHBAABAAAAxgAAACWIBAABAAAAziAA' +
                    'AOAgAABDYW5vbgBIAAAAAQAAAEgAAAABAAAAMjAxNjowODoyOSAxMzo1NjoyMgBkdHMgTmV3cwAA' +
                    'HwCaggUAAQAAAEACAACdggUAAQAAAEgCAAAiiAMAAQAAAAEAAAAniAMAAQAAAEABAAAAkAcABAAA' +
                    'ADAyMjEDkAIAFAAAAFACAAAEkAIAFAAAAGQCAAABkQcABAAAAAECAwABkgoAAQAAAHgCAAACkgUA' +
                    'AQAAAIACAAAEkgoAAQAAAIgCAAAHkgMAAQAAAAUAAAAJkgMAAQAAABAAAAAKkgUAAQAAAJACAAB8' +
                    'kgcAAB0AAJgCAACGkgcACAEAAJgfAACQkgIAAwAAADI2AACRkgIAAwAAADI2AACSkgIAAwAAADI2' +
                    'AAAAoAcABAAAADAxMDABoAMAAQAAAAEAAAACoAMAAQAAAFAAAAADoAMAAQAAAGEAAAAFoAQAAQAA' +
                    'ALAgAAAOogUAAQAAAKAgAAAPogUAAQAAAKggAAAQogMAAQAAAAIAAAABpAMAAQAAAAAAAAACpAMA' +
                    'AQAAAAEAAAADpAMAAQAAAAAAAAAGpAMAAQAAAAAAAAAAAAAAAQAAAGQAAAASAAAACgAAADIwMTM6' +
                    'MDE6MjkgMTA6NTk6MzIAMjAxMzowMToyOSAxMDo1OTozMgAAoAYAAAABAACgAQAAAAEAAAAAAAEA' +
                    'AABVAAAAAQAAACcAAQADADEAAAByBAAAAgADAAQAAADUBAAAAwADAAQAAADcBAAABAADACIAAADk' +
                    'BAAABgACAA0AAAAoBQAABwACABgAAAA2BQAACQACACAAAABOBQAADAAEAAEAAAAKhae3DQAHAAAG' +
                    'AABuBQAAEAAEAAEAAABQAgCAEwADAAQAAABuCwAAFQAEAAEAAAAAAACgGQADAAEAAAABAAAAJgAD' +
                    'AFsAAAB2CwAAgwAEAAEAAAAAAAAAkwADABoAAAAsDAAAlQACAEYAAABgDAAAlgACABAAAACmDAAA' +
                    'lwAHAAAEAAC2DAAAmAADAAQAAAC2EAAAmQAEAHwAAAC+EAAAmgAEAAUAAACuEgAAoAADAA4AAADC' +
                    'EgAAqgADAAYAAADeEgAAtAADAAEAAAABAAAA0AAEAAEAAAAAAAAA4AADABEAAADqEgAAAUADADkF' +
                    'AAAMEwAACEADAAMAAAB+HQAACUADAAMAAACEHQAAEEACACAAAACKHQAAEUAHAPwAAACqHQAAEkAC' +
                    'ACAAAACmHgAAE0AEAAUAAADGHgAAFUAHAHQAAADaHgAAFkAEAAYAAABOHwAAF0AEAAIAAABmHwAA' +
                    'GEAEAAMAAABuHwAAGUAHAB4AAAB6HwAAAAAAAGIAAgAAAAMAAAAFAAAAAgAAAAEAAAABAAAAAAAA' +
                    'AP9/DwADAAIAAAAEAP//mwBVAFUAAQA4ACABAAAAAAAAAAD///////8AAAAAAAAAAP////8AAAAA' +
                    '/3////////8AAP//AABVAJst6kwAAAAAAAAAAEQAAADUADgANADUAAAAAAADAAAACAAIAJYAAAAA' +
                    'AAAAAAAAAAEAAAAAADgA1ABtAAAAAAD4AP//////////AAAAAAAAQ2Fub24gRU9TIDdEAABGaXJt' +
                    'd2FyZSBWZXJzaW9uIDEuMi41AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKqqbRZt' +
                    'FVUAbWYAAwAAAAAAAAEAAAYAAACW0lRgagBVgAAAAAAAAAAAAAG7uwEBAAAAAAIBAAAAAAAAAAAA' +
                    'AAAAAAAAQGAD/QAAASBAAP/L/8jEAASmASAMzMwDAAAAAwAAAAQAAAAAAAAA8wAAAABKAABKAEoA' +
                    'AAAAAFAUAAAAAAAAAAAAAAEAAAABAAAAAQAAAAMAAAADAAAAAwAAAAEAAAAAAAAAAAAAAAAAAACB' +
                    'AAAAAQAAAAEAAAABAAAACAAAAQAAAAAEAAAADgAAAAAAAAAAAAAAAAAGBQAAAAADBgc7BQAAAAAW' +
                    'AQAAAAAAAAAAAAAAAAAAAAAAAAAABgHe3t7en4v7AAAAAAAAAAABFlAAmwBVAFWBZ9KPAAAAAQAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAABAFAAAgA0AAB0JAABoBQAABgIAALACAADQAgAA' +
                    '4AEAAAAAAAAAAAAA0AIAAKgBAAABAAAAAgAAAAIAAAADAAAABAAAAAUAAAABAAAAAAAAAAEAAAAB' +
                    'AAAAAAAAAAAAAAAAAAAAAAIAAAABAAEAMS4yLjUAN0QuN0MuNEMAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAaQAAAGQAAABkAAAAHRAAAAAAAAAAAAAAagAAAGQAAABkAAAACAAA' +
                    'AAgAAAAIAAAACAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwDAAQABKoB' +
                    '4KmgUQqFp7cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADvAQAEAATDAgAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7wEABAAEwwIAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO8BAAQABMMCAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADvAQAEAATDAgAAAAAAAAAAAAAAAAAAAAABAAAA' +
                    'AQAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAIEAgQCBAAAA' +
                    '//////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQABAAEAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAQABAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQABAAEAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEAAQABAAAAAAAAAAAlKsHUQoBAAAEAAAA' +
                    'BAAAAAAAAAAAAAAABAAAAAAAAAAAAAAQAAAAAAAAAAD2KgAALL4AAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnwAHAHAA' +
                    'tgACABMAEwBAFIANQBSADd4A3gDeAN4A3gDeAN4A3gDeAN4A3gDeAN4A3gDeAN4A3gDeAN4ACgEK' +
                    'AQoBCgEKAQoBCgEKAQoBCgEKAQoBCgEKAQoBCgEKAQoBCgGj+o/8j/yP/Hf+d/53/gAAAAAAAAAA' +
                    'AACJAYkBiQFxA3EDcQNdBQAAiQEAAHf+iQEAAHf+5wKJAQAAd/4Z/YkBAAB3/okBAAB3/gAAAAIA' +
                    'AAACAAAAAAAA//80AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////1QAAAAAAAAApgQgAQAA' +
                    'FwAAAAAARUY4NW1tIGYvMS44IFVTTQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAFMxMzc1MTQyQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAQAABAAAAAEAAABcAAAA' +
                    'BwAAAAEBAAABAAAAAAAAAAIBAAABAAAAAAAAAAMBAAABAAAAAQAAAAQBAAABAAAAAAAAAAUBAAAB' +
                    'AAAAAAAAAAgBAAABAAAAAAAAAA8BAAABAAAAAAAAAAIAAAAsAAAAAwAAAAECAAABAAAAAAAAAAIC' +
                    'AAABAAAAAAAAAAMCAAABAAAAAAAAAAMAAAC4AAAADQAAAAIFAAABAAAAAAAAAAQFAAABAAAAAAAA' +
                    'AAMFAAABAAAAAAAAAAUFAAABAAAAAAAAAAcFAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASBQAA' +
                    'AgAAAAAAAAAHAAAAEwUAAAEAAAAAAAAAEAUAAAEAAAAAAAAAFAUAAAEAAAAAAAAAFQUAAAEAAAAA' +
                    'AAAADgUAAAEAAAAAAAAAFgUAAAEAAAAAAAAADwYAAAEAAAAAAAAABAAAAJgAAAAEAAAADAcAABkA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADeAAAA3gAAAN4AAADeAAAABgcAAAEAAAAAAAAA' +
                    'DwgAAAEAAAAAAAAADggAAAEAAAAAAAAAAAAAAEAUAACADQAAAAAAAAAAAAAcAAAAAwAAAAAAAAAA' +
                    'AAAA//9QFIEAAAAAAAAADAArBAAEAAQ/AQAAIgDwFLwNAQABAKgAOADnFLcNAAAAAAAAAAAAAAAA' +
                    'AAAAAAcALgMABAAEjAFCAgAEAAQWAqABAAQABOMC5QPmBPEE6QHIAg0FDgWtAuYB6wTkBKoD/v8A' +
                    'APYA9AD4AAAADAioEKUQlwn3A1cBUgE5AKkA2gPdAxwGuQdGDVINyAIiCIsRlRHxCi4ETAFXATYA' +
                    'owCkA5EDgwayB6ANzQ38AlcGAAQABJsI1AxXBgAEAASbCNQMwwUHBPgDxAmYCwAAAAAAAAAAAACJ' +
                    'CAAEAASXBVAU6wkABAAEuARYGzQJAAQABB8FcBf5BQAEAAR2CIAMjwcABAAE9Ae5DokIAAQABJcF' +
                    'UBRrCQAEAAQYBQgYEAUABAAEgQnNCokIAAQABJcFUBSJCAAEAASXBVAUiQgABAAElwVQFIkIAAQA' +
                    'BJcFUBTpAwAEAASyA+0P6QMABAAEsgPtD+kDAAQABLID7Q/pAwAEAASyA+0P6QMABAAEsgPtD3T+' +
                    'aAEABJQqjv5zAdsDECe5/oUBnQNsIOj+nQFkA1gbI/+9ASADcBdA/80BAAPgFWH/4AHdAlAUlP/6' +
                    'AaYCXBLQ/yACawJoEAsATQI7AtgOQAB3AhICrA2AAK4C5AGADLUA2gK+AbgL4gAOA6YB8ApVAZcD' +
                    'bQFgCfQBEAggCP8H/wf/B/8HAAAAAAAAAAAAAAAAAAAAAAAAAAAAACoAAAAeAB8AHgAAAAAAAAAA' +
                    'AAAAAAAAABcAAAAVAB4ALAA4ADoAMQAlAAAAAAAAAAAAAAAAAAAAGgAAACUAFQA8AE0ARgBOAC8A' +
                    'AAAAAAAAFwAdABcAGgAYAB0AJQAwAEEAWQB3AJsAPgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJwAA' +
                    'ABsAHwAfAAAAAAAAAAAAAAAAAAAAFQAAABkAIwA7AE8ATwA8ACYAAAAAAAAAAAAAAAAAAAAbAAAA' +
                    'NwAbAFUAcABjAGoANQAAAAAAAAAeACAAHgAwAB4ANABAAFQAbQCMALQA3gBPAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAA3AAAAJgAlACEAAAAAAAAAAAAAAAAAAAAlAAAAIQAtAEEAUwBTAEAAKQAAAAAA' +
                    'AAAAAAAAAAAAACsAAAA/ACEAXQB1AGgAbAA3AAAAAAAAAC0ANQArADcALQA5AEUAVwBvAI8AuADh' +
                    'AE4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMAAAANAA4ADQAAAAAAAAAAAAAAAAAAAAwAAAANABIA' +
                    'HgAnACYAGgAOAAAAAAAAAAAAAAAAAAAADgAAAB4ADQAqADYALwAuABMAAAAAAAAAEwARABEAHAAP' +
                    'ABwAIAApADMAQABSAFsAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAA' +
                    'AQASAAMAAAAAAAAAAAAAAAAAAAABAAAAAQALAA4AGAAsAIQBYwAAAAAAAAAAAAAAAAAAAAIAAAAC' +
                    'AAEAFQAwAEUAVgM9AAAAAAAAAAUAAQAHAAQACAAXADEAfgDUARgDaA7F7m0IAAAAAAAAAIAAAAAE' +
                    'AAQABI4KzA4qGPYQXwClAOoRGw+w/3X/TQ4AAP0AAwAEmwMA9HIDAJZnAQBEEwAEAAQAAAAEAAAA' +
                    'AAAAAAAAAP8fAAH/HwABAAAAAAACtgLeAe8BwwKaAWYDAAAAAAAAAAAAACAAQACAAOAAAAEAAQAA' +
                    'IwBIAIgA4QAAAQABAQAAALIAAAAAABAAIABAAGAAgADAAAAAAAAAAAAAAADe/9//9QP1A/UD9QP1' +
                    'AyAEHgSIBAEA/wf+BwAIAAgAALExiCwAEAAAAAC0BigHGAuYC7QGKAcYCpgKtAYoB5gKGAsAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAACPAG8AigAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB2xwAA' +
                    'IABAAIAA4AAAAQABAAAjAEgAiADhAAABAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACB' +
                    'AIEAgQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAACgAA' +
                    'AAAAAAAAEHQAAAAAAAAAAAAgAAAAAAAAAMwQQBSADQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAABgAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAYBBQAAAHx9DAAAAAAAAAAAAAAAAAACn1kA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                    'AAAAABpPAIsDAAAAvDQAUwIAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAAAEAAAABAAQA' +
                    'AAACAgAAAAAAAAYAAwEDAAEAAAAGAAAAGgEFAAEAAAAuIQAAGwEFAAEAAAA2IQAAKAEDAAEAAAAC' +
                    'AAAAAQIEAAEAAAA+IQAAAgIEAAEAAAD6BgAAAAAAAEgAAAABAAAASAAAAAEAAAD/2P/gABBKRklG' +
                    'AAEBAAABAAEAAP/bAEMACgcHCAcGCggICAsKCgsOGBAODQ0OHRUWERgjHyUkIh8iISYrNy8mKTQp' +
                    'ISIwQTE0OTs+Pj4lLkRJQzxINz0+O//bAEMBCgsLDg0OHBAQHDsoIig7Ozs7Ozs7Ozs7Ozs7Ozs7' +
                    'Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O//AABEIAFAAQQMBIgACEQEDEQH/xAAf' +
                    'AAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEF' +
                    'EiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJ' +
                    'SlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3' +
                    'uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEB' +
                    'AAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIy' +
                    'gQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNk' +
                    'ZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfI' +
                    'ycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APXKhuB8h+lT1heLNYi0' +
                    'nSHd32s42rjrVXtqK1zxvU/DL3XiW+1CeURw/aCygdTg16Pa+Oo4IIoRan5FA3Plf8a8/k1IXdyG' +
                    'jDH2/u1dWVmIZnDDGMY/qeK5HKVzeyaPRo/HNqSA9pNz/EvIrdsdWsr+NWgnUlv4CcN+VeWJqMMa' +
                    '7ZXADccfMx+g/wAKljnhEgeNJIXByjZ+Yn1+WqVWS3JcE9j1qg1jeGtWl1PS1kuMGZGKMQMZ9DWy' +
                    'a3TTV0ZNWEooopgQ3NwtrbvM5wqjJNeE+PPFsur3/lxuGiDEKAeMDivUviJqc2l+FZJIY97SuIyc' +
                    '425zzXhtxCl3qqxDGM4bB+8c/wCTUT3KiS6el7dsiWqtkD5mA4Wuy0jw3LKqvfTMR1xnk1paRHb2' +
                    'enJCkaoNvYVegUyghTkA1xVJ62R204K12ZN7okcUTvECGHA9cVY0PT0VA02Nx9e3tW9H5LR7J2+b' +
                    '1zVhPscQwWB/Gsrs0siXTb2G0ZYGOFJ+8PWuiBJKjdXJ3UEL28jRMGVl555BrpdIZ5tKtpJv9YUG' +
                    'T6+9dVBuWhyVUosu4ooorrOc5vx7atdeD70KcNGokHvg9DXilhCltdGa4QpK54DKRkV9C6hEs2nX' +
                    'EbDIaNgRj2ryNYf9Iisn3zZBcludgH/66xqy5Wjoo0+ZN9iS2vITH5k0oHHTPQVHceJPKib7GJJi' +
                    'O0S521ICBOQn3AelWI4k2yNDG0Zbg46VxXV9Ts5W1oYr6revcpJcNIo4Ynso+lX/ABDcy29ray2r' +
                    'zN5+Ru2svOM9xzSfZo5HaM73LnDE8nHsK6YaYl7pG2ZVPlkMmeCtNuN9hWdjnPDl9qM0gFwJVVjt' +
                    'xKTXqGnXzNapEtvKvlLtJZCoOOOM9elcbp1lb2L+aZXdTwq5yK7pZGgUIkZKgmuig022jlrq1h/2' +
                    'hv7hopPtLf8API/lRXScxPXAa/ZDSr+YqihJRujY9h6V32RXN+O9Pk1Lw+UgQtNHKrqR1A7/AKVF' +
                    'WHPE1pVOSRwshBw4A57+tQTanLBGETkngD1qGS7CFY24K8GjzYiTuAYMMV5zVnqejF6F2zjL2rSf' +
                    'amW4f/lon8PsKjs5tRS5FtNcMyg58zPJFVjotmE8xJ7pFPO1ZTgfgahSwtpZNn2q8XnjawGKvSw9' +
                    'TZ0md4tQjsjL5qNINp/HpXrZArynwZo7y+IVUs0iQN5jOxz06V6rmujDrRs4sS7tIMD0ooorqOUq' +
                    '596w59dhutfbw9bo0kohL3EoPywg8AfUk1g+M/iNaaJbm10uSO6vXBG5TlYvc+p9q5n4T6lJd+Id' +
                    'UNxIZJ7iISl2PJIbn+YqpPQlEGs2DWkzwkkvE5BJ71mLMynnt2r0DxhockgOpW67h/y2X0P96uDk' +
                    'j5OR9a82UWnZnqRakro17fVbcwBWUEj1qWG8geZQtuGYnCgDvWPbW8b9R0rovDFij6tCSp2Q/vX4' +
                    'zwvNZ21sXzWVz0PQ9Ji0u1JC4nmw0p9/T6CtLPPWq9nfW1/brPazLLGwyCpqUfeNd6VlZHmttu7H' +
                    '596KTNFAj//Z/+EN+mh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2lu' +
                    'PSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4' +
                    'PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcv' +
                    'MTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiB4bWxuczpleGlm' +
                    'PSdodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyc+CiAgPGV4aWY6TWFrZT5DYW5vbjwvZXhp' +
                    'ZjpNYWtlPgogIDxleGlmOk1vZGVsPkNhbm9uIEVPUyA3RDwvZXhpZjpNb2RlbD4KICA8ZXhpZjpP' +
                    'cmllbnRhdGlvbj5Ub3AtbGVmdDwvZXhpZjpPcmllbnRhdGlvbj4KICA8ZXhpZjpYUmVzb2x1dGlv' +
                    'bj43MjwvZXhpZjpYUmVzb2x1dGlvbj4KICA8ZXhpZjpZUmVzb2x1dGlvbj43MjwvZXhpZjpZUmVz' +
                    'b2x1dGlvbj4KICA8ZXhpZjpSZXNvbHV0aW9uVW5pdD5JbmNoPC9leGlmOlJlc29sdXRpb25Vbml0' +
                    'PgogIDxleGlmOkRhdGVUaW1lPjIwMTM6MDE6MjkgMTA6NTk6MzI8L2V4aWY6RGF0ZVRpbWU+CiAg' +
                    'PGV4aWY6QXJ0aXN0PmR0cyBOZXdzPC9leGlmOkFydGlzdD4KICA8ZXhpZjpZQ2JDclBvc2l0aW9u' +
                    'aW5nPkNvLXNpdGVkPC9leGlmOllDYkNyUG9zaXRpb25pbmc+CiAgPGV4aWY6Q29weXJpZ2h0PltO' +
                    'b25lXSAoUGhvdG9ncmFwaGVyKSAtICAoRWRpdG9yKTwvZXhpZjpDb3B5cmlnaHQ+CiAgPGV4aWY6' +
                    'Q29tcHJlc3Npb24+SlBFRyBjb21wcmVzc2lvbjwvZXhpZjpDb21wcmVzc2lvbj4KICA8ZXhpZjpY' +
                    'UmVzb2x1dGlvbj43MjwvZXhpZjpYUmVzb2x1dGlvbj4KICA8ZXhpZjpZUmVzb2x1dGlvbj43Mjwv' +
                    'ZXhpZjpZUmVzb2x1dGlvbj4KICA8ZXhpZjpSZXNvbHV0aW9uVW5pdD5JbmNoPC9leGlmOlJlc29s' +
                    'dXRpb25Vbml0PgogIDxleGlmOk1ha2U+Q2Fub248L2V4aWY6TWFrZT4KICA8ZXhpZjpPcmllbnRh' +
                    'dGlvbj5Ub3AtbGVmdDwvZXhpZjpPcmllbnRhdGlvbj4KICA8ZXhpZjpYUmVzb2x1dGlvbj43Mjwv' +
                    'ZXhpZjpYUmVzb2x1dGlvbj4KICA8ZXhpZjpZUmVzb2x1dGlvbj43MjwvZXhpZjpZUmVzb2x1dGlv' +
                    'bj4KICA8ZXhpZjpSZXNvbHV0aW9uVW5pdD5JbmNoPC9leGlmOlJlc29sdXRpb25Vbml0PgogIDxl' +
                    'eGlmOkRhdGVUaW1lPjIwMTM6MDE6MjkgMTI6Mzc6MDE8L2V4aWY6RGF0ZVRpbWU+CiAgPGV4aWY6' +
                    'QXJ0aXN0PmR0cyBOZXdzPC9leGlmOkFydGlzdD4KICA8ZXhpZjpZQ2JDclBvc2l0aW9uaW5nPkNv' +
                    'LXNpdGVkPC9leGlmOllDYkNyUG9zaXRpb25pbmc+CiAgPGV4aWY6Q29weXJpZ2h0PltOb25lXSAo' +
                    'UGhvdG9ncmFwaGVyKSAtICAoRWRpdG9yKTwvZXhpZjpDb3B5cmlnaHQ+CiAgPGV4aWY6Q29tcHJl' +
                    'c3Npb24+SlBFRyBjb21wcmVzc2lvbjwvZXhpZjpDb21wcmVzc2lvbj4KICA8ZXhpZjpYUmVzb2x1' +
                    'dGlvbj43MjwvZXhpZjpYUmVzb2x1dGlvbj4KICA8ZXhpZjpZUmVzb2x1dGlvbj43MjwvZXhpZjpZ' +
                    'UmVzb2x1dGlvbj4KICA8ZXhpZjpSZXNvbHV0aW9uVW5pdD5JbmNoPC9leGlmOlJlc29sdXRpb25V' +
                    'bml0PgogIDxleGlmOkV4cG9zdXJlVGltZT4xLzEwMCBzZWMuPC9leGlmOkV4cG9zdXJlVGltZT4K' +
                    'ICA8ZXhpZjpGTnVtYmVyPmYvMS44PC9leGlmOkZOdW1iZXI+CiAgPGV4aWY6RXhwb3N1cmVQcm9n' +
                    'cmFtPk1hbnVhbDwvZXhpZjpFeHBvc3VyZVByb2dyYW0+CiAgPGV4aWY6SVNPU3BlZWRSYXRpbmdz' +
                    'PgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGk+MzIwPC9yZGY6bGk+CiAgIDwvcmRmOlNlcT4KICA8' +
                    'L2V4aWY6SVNPU3BlZWRSYXRpbmdzPgogIDxleGlmOkV4aWZWZXJzaW9uPkV4aWYgVmVyc2lvbiAy' +
                    'LjIxPC9leGlmOkV4aWZWZXJzaW9uPgogIDxleGlmOkRhdGVUaW1lT3JpZ2luYWw+MjAxMzowMToy' +
                    'OSAxMDo1OTozMjwvZXhpZjpEYXRlVGltZU9yaWdpbmFsPgogIDxleGlmOkRhdGVUaW1lRGlnaXRp' +
                    'emVkPjIwMTM6MDE6MjkgMTA6NTk6MzI8L2V4aWY6RGF0ZVRpbWVEaWdpdGl6ZWQ+CiAgPGV4aWY6' +
                    'Q29tcG9uZW50c0NvbmZpZ3VyYXRpb24+CiAgIDxyZGY6U2VxPgogICAgPHJkZjpsaT5ZIENiIENy' +
                    'IC08L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvZXhpZjpDb21wb25lbnRzQ29uZmlndXJhdGlv' +
                    'bj4KICA8ZXhpZjpTaHV0dGVyU3BlZWRWYWx1ZT42LjYzIEVWICgxLzk4IHNlYy4pPC9leGlmOlNo' +
                    'dXR0ZXJTcGVlZFZhbHVlPgogIDxleGlmOkFwZXJ0dXJlVmFsdWU+MS42MyBFViAoZi8xLjgpPC9l' +
                    'eGlmOkFwZXJ0dXJlVmFsdWU+CiAgPGV4aWY6RXhwb3N1cmVCaWFzVmFsdWU+MC4wMCBFVjwvZXhp' +
                    'ZjpFeHBvc3VyZUJpYXNWYWx1ZT4KICA8ZXhpZjpNZXRlcmluZ01vZGU+UGF0dGVybjwvZXhpZjpN' +
                    'ZXRlcmluZ01vZGU+CiAgPGV4aWY6Rmxhc2ggcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogIDwv' +
                    'ZXhpZjpGbGFzaD4KICA8ZXhpZjpGb2NhbExlbmd0aD44NS4wIG1tPC9leGlmOkZvY2FsTGVuZ3Ro' +
                    'PgogIDxleGlmOk1ha2VyTm90ZT43NDI0IGJ5dGVzIHVuZGVmaW5lZCBkYXRhPC9leGlmOk1ha2Vy' +
                    'Tm90ZT4KICA8ZXhpZjpVc2VyQ29tbWVudCAvPgogIDxleGlmOlN1YnNlY1RpbWU+MjY8L2V4aWY6' +
                    'U3Vic2VjVGltZT4KICA8ZXhpZjpTdWJTZWNUaW1lT3JpZ2luYWw+MjY8L2V4aWY6U3ViU2VjVGlt' +
                    'ZU9yaWdpbmFsPgogIDxleGlmOlN1YlNlY1RpbWVEaWdpdGl6ZWQ+MjY8L2V4aWY6U3ViU2VjVGlt' +
                    'ZURpZ2l0aXplZD4KICA8ZXhpZjpGbGFzaFBpeFZlcnNpb24+Rmxhc2hQaXggVmVyc2lvbiAxLjA8' +
                    'L2V4aWY6Rmxhc2hQaXhWZXJzaW9uPgogIDxleGlmOkNvbG9yU3BhY2U+c1JHQjwvZXhpZjpDb2xv' +
                    'clNwYWNlPgogIDxleGlmOlBpeGVsWERpbWVuc2lvbj41MDA8L2V4aWY6UGl4ZWxYRGltZW5zaW9u' +
                    'PgogIDxleGlmOlBpeGVsWURpbWVuc2lvbj43MTg8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogIDxl' +
                    'eGlmOkZvY2FsUGxhbmVYUmVzb2x1dGlvbj41NzE1LjU0NjwvZXhpZjpGb2NhbFBsYW5lWFJlc29s' +
                    'dXRpb24+CiAgPGV4aWY6Rm9jYWxQbGFuZVlSZXNvbHV0aW9uPjU4MDguNDAzPC9leGlmOkZvY2Fs' +
                    'UGxhbmVZUmVzb2x1dGlvbj4KICA8ZXhpZjpGb2NhbFBsYW5lUmVzb2x1dGlvblVuaXQ+SW5jaDwv' +
                    'ZXhpZjpGb2NhbFBsYW5lUmVzb2x1dGlvblVuaXQ+CiAgPGV4aWY6Q3VzdG9tUmVuZGVyZWQ+Tm9y' +
                    'bWFsIHByb2Nlc3M8L2V4aWY6Q3VzdG9tUmVuZGVyZWQ+CiAgPGV4aWY6RXhwb3N1cmVNb2RlPk1h' +
                    'bnVhbCBleHBvc3VyZTwvZXhpZjpFeHBvc3VyZU1vZGU+CiAgPGV4aWY6V2hpdGVCYWxhbmNlPkF1' +
                    'dG8gd2hpdGUgYmFsYW5jZTwvZXhpZjpXaGl0ZUJhbGFuY2U+CiAgPGV4aWY6U2NlbmVDYXB0dXJl' +
                    'VHlwZT5TdGFuZGFyZDwvZXhpZjpTY2VuZUNhcHR1cmVUeXBlPgogIDxleGlmOkdQU1ZlcnNpb25J' +
                    'RD4yLjIuMC4wPC9leGlmOkdQU1ZlcnNpb25JRD4KICA8ZXhpZjpJbnRlcm9wZXJhYmlsaXR5SW5k' +
                    'ZXg+Ujk4PC9leGlmOkludGVyb3BlcmFiaWxpdHlJbmRleD4KICA8ZXhpZjpJbnRlcm9wZXJhYmls' +
                    'aXR5VmVyc2lvbj4wMTAwPC9leGlmOkludGVyb3BlcmFiaWxpdHlWZXJzaW9uPgogPC9yZGY6RGVz' +
                    'Y3JpcHRpb24+Cgo8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSdyJz8+Cv/b' +
                    'AEMACgcHCAcGCggICAsKCgsOGBAODQ0OHRUWERgjHyUkIh8iISYrNy8mKTQpISIwQTE0OTs+Pj4l' +
                    'LkRJQzxINz0+O//bAEMBCgsLDg0OHBAQHDsoIig7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7' +
                    'Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O//CABEIAGEAUAMBIQACEQEDEQH/xAAbAAACAwEBAQAAAAAA' +
                    'AAAAAAADBQIEBgEAB//EABgBAAMBAQAAAAAAAAAAAAAAAAECAwAE/9oADAMBAAIQAxAAAAHXcIzi' +
                    'dH1BQLhHX3tueOzimLktgyasGnqJyjjhZza4RH802fTrOOEIVvJ0adlUVwawwvCp8+dWjSNilnQn' +
                    'cIubwD85dWVqF64DmKrHRuaRNks4ZxpMOLGvg2YWgRDmpB57EGWnPBs0tz9BRMpzl6Q9JhI7QuK8' +
                    '8fUTKr+e87s6gmdp7PTyCWuoM9zdMLatJ4Q35bnV4t13uYjenOdD6tks8rH5lWdfpyudUE43tMnk' +
                    '89Sf/8QAJhAAAgICAQQCAQUAAAAAAAAAAQIAAwQREhATISIFFDEgIzIzNf/aAAgBAQABBQLp8spa' +
                    'jCq+tcM5J9ymI62D9OXbtw+yPMGjPZZjZJLdcq8U1tbzdbFEXk8IeJ5NVenBm4fxnXtY9NbWMmGE' +
                    'ihVjJsV1cYdyl/YTKLDFc+uINDluKIHCzuKJ3Faa/eli869e1bDXcRY+T4LNskHGVnLYzEQPvpaO' +
                    '3aFAUaI1pdShPX6/GUKBOQ6ZdI7ja6GxQE8xMsqWvbliezaHS2vu1h+TQruC9ljXK0N/KfHD0m5u' +
                    'ZNYptD+eU2dbsjAsKK+1V0zMr6yZVe63HncW7x3ZhJyHTKzK8VPsNblsodbq2raKoMC6lHFE6X/2' +
                    'wfjP6JE/lb/o9P/EAB8RAAEDBQEBAQAAAAAAAAAAAAEAAhADESExMiASQf/aAAgBAwEBPwFN0reB' +
                    'B8fKthWQTBJhkv2gm6V0Sn7VLaCtD9qkc+H9IGxQN0Yf1DNScmG8w84mmfyKks6ipH//xAAfEQAC' +
                    'AgICAwEAAAAAAAAAAAAAAQIQETEDIRIgMkH/2gAIAQIBAT8BJPs8l6PdRdOsmexMZJ3EZK+PQyWz' +
                    'AkQ0cgzJkhonqlXH8jGsCGmQ+alu10qluo7pkl+1C5aqFf/EACgQAAEDAgUEAgMBAAAAAAAAAAEA' +
                    'AhEQIQMSIDFRIkFhgRMyQnGRcv/aAAgBAQAGPwKgA5QxHlWCuVLTOqOFe62XK+8e18WJv2Og8qSV' +
                    '5VhK4VhB5QM7aHcKGrqVhoyH1TELPtCAPfRerI5o5p7hdXZbr7D+rpk+Qr7ouEn0tjdBxvHhTB90' +
                    'ffonZSF1KGrkrJ+KhvZb3r4co4rmy24UZcvhBx2KcfFcqIIiLUlXw3/xXbdRlI/YTjosbuvpE3KD' +
                    'e/eoyjNiOs0Jj3XcLHT8jvVeXdmpuLiH8gsp2KIdoGHPUBcVdQJlWof5r//EACUQAQACAgEEAgID' +
                    'AQAAAAAAAAEAESExQRBRYXGBoSCRscHR8f/aAAgBAQABPyGMIu1ihYxVRLSPyQ1Uspj/ABOpiqVp' +
                    'MxolFwzHi24riVlE3tAKx7Tf4ZKyjPscza36RIX+2ZmioN1L1F+xLXRa+ntUdNnwAElFbe8NLWu4' +
                    'TVBLGN2RA1F9e42jQoLFS9rO0ylVEipYXA66MYj+4Wtaweh6UxNfFVdYlIUDliaarTfBFYl2uNGg' +
                    'XtCFMcgxKUZdCvMc4R4U9EwdPR5h0QvUwWkDcG+055UwY1A13SoKiVpSTAIQC14Zm6bjv/7CsPCD' +
                    'U0LUCd3DuiLLijHmjJjxdCTR4YmWGxFu4+DNcQ6jfSZhCBITagljwdKdDjIjSZFwyKmwb7kbrzE8' +
                    'KOIXvntL6VgEwpShWkouQRmU0l1xEr+f++t4UfRG8xPQFxnoYLXp7xJsCEsEwGpPsjCfanM+lP4m' +
                    'OptPsE+q/ucQ1P/aAAwDAQACAAMAAAAQMPf78d+FOS3lmpSmfX8FDSHWdNI3hHo6mWIde58dnOyP' +
                    '/8QAHREBAQEAAwADAQAAAAAAAAAAAQARECExIEFRcf/aAAgBAwEBPxCEX8BhbDTgNYjps08GjZkk' +
                    'cWIcPXANkE9dSfRwDt/I51P0kx4cM/se8dXtYDB2JY2k+1sukMv7LR5hsOJekyXQc+F93s4//8QA' +
                    'HBEBAQEBAAMBAQAAAAAAAAAAAQARMRAhQSBR/9oACAECAQE/ELKFDvl6mywc8LCSQMR8L5si2WWh' +
                    'dzg/DCwye4ndhl4J+9iEdPX8m1kny4Q0y2ZDTLFcrI+1yWwBN1kgPivniMfa+ek8uWb/xAAkEAEA' +
                    'AgIBAwQDAQAAAAAAAAABABEhMUEQUWFxgaGxkcHR8P/aAAgBAQABPxCHDKvCge8eoRrtv5+J5KdK' +
                    'j9y2J7TTKyAw1sfJ1elLQ1WFDdC8q+JVoPLJgPBE9wFjx+qh1QowH2blgw1Db9RBEmWmPD58yxj0' +
                    'WG4IF68y7Su3a83QSoArXa/v3O/AKlfl/UKAB5T0vBL2j6dgPnvMVEAcmOZbmsMo4Jk6qLgQBQFF' +
                    'vOb8wE58LMEYi3m69ITMnMMACJd95boLN6gJSJ2h01rc7+Ja1kbgNdsZ+oqTme/bf5lPcUvtRxBF' +
                    'PSU6x4YMYp4dyiIgpiFIY7AxL/lBDk56WeXWt5I1u5lqE3QXHBRyiGL1B6A6MP7FKjmrH5EKrTkX' +
                    '7lAfqq8bzVRxph1g5ysujQC5xaLgcLcKHqPS9xXaMhulQOrmAoriBNrXa4lxIsnrV7+ZukpQALQ+' +
                    '6X1pa2xpUjEJRjftGLiBhkEmonR1ijXTvw/cbGwQJqoGLk0kbiA5MTGrsafONKhqwjLWQC+Fwb5K' +
                    'HzHpHEm1uGMwuJ4Rp+SG6Sz3OHywCs75fkWRAKCxs+ZQ6FigfRYO3SxXxb/OoiLNxPYL/YoGUxz2' +
                    'wQ2FPUhKkHeoaAgnb4iFCh7jcpCUPnW4Vxb4LjQgA6FS8Ha7iv7sRpwygUBHJ4IiC1QJp5hZdxyJ' +
                    '6Zle72JfhhXCGA4Ccd4s4eGZ+o2BgdyD7MoMkulS4JQOZhnC79LX8TRmk+Zh958BNf8APU1evR/2' +
                    'u/RY19Ol/9k='),
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

        it('does not detect a face in a raw blob', function (done) {
            // For now, data URIs are expected to be base-64 encoded, which they generally are anyway.
            assert.throws(() => { oxford.makeBuffer('data:image/jpeg,this-is-not-supported-at-the-moment') });
            done();
        });
    });

    describe('#similar()', function () {
        it('detects similar faces', function (done) {
            var detects = [];

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

        it('detects a face on an alternate host', function (done) {
            const server = http.createServer((req, res) => {
                var body = [];
                req.on('data', function(chunk) { body.push(chunk); });
                req.on('end', function() {
                    var json = JSON.parse(Buffer.concat(body).toString());
                    assert.ok(req.url.indexOf('/detect') > 0);
                    assert.ok(JSON.stringify(json) === '{\"url\":\"just-checking!\"}');
                    res.end();
                    done();
                });
            })
            .listen(8080, 'localhost');

            var altClient = new oxford.Client(process.env.OXFORD_KEY, 'http://localhost:8080');

            altClient.face.detect({ url: 'just-checking!' });
        });
    });
});
