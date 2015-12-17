var assert = require('assert'),
    _Promise = require('bluebird'),
    uuid = require('uuid'),
    fs = require('fs'),
    oxford = require('../dist/oxford'),
    client = new oxford.Client(process.env.OXFORD_KEY);

var apiModels = {};
describe('Project Oxford WebLM API Test', function () {
    describe('#listModels()', function () {
        it('gets a list of models', function (done) {
            client.weblm.listModels()
            .then(function (response) {
                assert.ok(response);
                // Transpose the 'supportedOperations' field
                response.models.forEach(function (model) {
                    model.supportedOperations.forEach(function (operation) {
                        (apiModels[operation] = apiModels[operation] || []).push({name: model.model, maxOrder: model.maxOrder});
                    })
                })
                assert.ok(apiModels.breakIntoWords);
                assert.ok(apiModels.breakIntoWords[0].name);
                assert.ok(apiModels.breakIntoWords[0].maxOrder > 1);
                done();
            }).catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
    });

    describe('#breakIntoWords()', function () {
        this.timeout(5000);
        it('break a popular hashtag phrase', function (done) {
            client.weblm.breakIntoWords(apiModels.breakIntoWords[0].name, 'thanksobama')
            .then(function (response) {
                assert.ok(response.candidates.length > 0);
                assert.equal(response.candidates[0].words, 'thanks obama');
                done();
            }).catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('break a popular hashtag phrase using optional arguments, and with trimming', function (done) {
            var models = apiModels.breakIntoWords;
            var model = models[models.length - 1];
            client.weblm.breakIntoWords(model.name, '  starwarstheforceawakens ', {
                order: Math.min(3, model.maxOrder),
                maxCandidates: 2
            })
            .then(function (response) {
                assert.ok(response.candidates.length > 0);
                assert.ok(response.candidates.length <= 2);
                assert.equal(response.candidates[0].words, 'star wars the force awakens');
                done();
            }).catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
    });

    describe('#generateWords()', function () {
        it('find candidate words to follow', function (done) {
            client.weblm.generateWords(apiModels.generateNextWords[0].name, 'hello world wide')
            .then(function (response) {
                assert.ok(response);
                assert.ok(response.candidates.length > 0);
                assert.equal(response.candidates[0].word, 'web');
                assert.ok(response.candidates[0].probability < 0); // Log probability
                done();
            }).catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
    });

    describe('#getConditionalProbabilities()', function () {
        it('looks up the conditional probability of "web" following "hello world wide', function (done) {
            client.weblm.getConditionalProbabilities(apiModels.calculateConditionalProbability[0].name, [{
                words: 'hello world wide',
                word: 'web'
            },{
                words: 'hello world wide',
                word: 'what'
            }])
            .then(function (response) {
                assert.ok(response);
                assert.equal(response.results.length, 2);
                assert.equal(response.results[0].words, 'hello world wide');
                assert.equal(response.results[0].word, 'web');
                assert.ok(response.results[0].probability < 0, 'Log probability cannot exceed 0');
                assert.equal(response.results[1].words, 'hello world wide');
                assert.equal(response.results[1].word, 'what');
                assert.ok(response.results[1].probability < 0, 'Log probability cannot exceed 0');
                assert.ok(response.results[0].probability > response.results[1].probability, 'web should be likelier than what');
                done();
            }).catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
    });

    describe('#getJointProbabilities()', function () {
        it('looks up the joint probability some word sequences', function (done) {
            var model = apiModels.calculateJointProbability[0];
            client.weblm.getJointProbabilities(
                model.name, [
                    'the',
                    'world wide web'
                ],
                Math.min(3, model.maxOrder))
            .then(function (response) {
                assert.ok(response);
                assert.equal(response.results.length, 2);
                assert.equal(response.results[0].words, 'the');
                assert.ok(response.results[0].probability < 0, 'Log probability cannot exceed 0');
                assert.equal(response.results[1].words, 'world wide web');
                assert.ok(response.results[1].probability < 0, 'Log probability cannot exceed 0');
                assert.ok(response.results[0].probability > response.results[1].probability);
                done();
            }).catch(function (error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
    });});