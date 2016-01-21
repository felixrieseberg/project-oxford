var assert   = require('assert'),
    _Promise = require('bluebird'),
    oxford   = require('../dist/oxford'),
    client   = new oxford.Client(process.env.OXFORD_KEY);

describe('Project Oxford Text API Test', function () {
    afterEach(function() {
        // delay after each test to prevent throttling
        var now = +new Date() + 1000;
        while(now > +new Date());
    });

    describe('#spellCheck', function() {
        it('Spell check a word without additional context, no case correction', function(done) {
            client.text.spellCheck('micro$oft').
            then(function(json) {
                assert.equal(json.spellingErrors.length, 1);
                var err = json.spellingErrors[0];
                assert.equal(err.offset, 0);
                assert.equal(err.token, 'micro$oft');
                assert.equal(err.type, 'UnknownToken');
                assert.equal(err.suggestions.length, 1);
                var suggestion = err.suggestions[0];
                assert.equal(suggestion.token, 'microsoft');
                done();
            }).
            catch(function(error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('Proof a word with context; Ode Too Joy -> Ode To Joy', function(done) {
            client.text.proof('Too', 'Ode', 'Joy').
            then(function(json) {
                var expected = {
                    spellingErrors: [{
                        offset: 0,
                        token: 'Too',
                        type: 'UnknownToken',
                        suggestions: [{
                            token: 'To'
                        }]
                    }]
                };
                assert.deepEqual(json, expected);
                done();
            }).
            catch(function(error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });

        it('Proof one of the most commonly mispelled names, and also case-corrects', function(done) {
            client.text.proof('Arnold shuwartsanayger').
            then(function(json) {
                var expected = {
                    spellingErrors: [{
                        offset: 7,
                        token: 'shuwartsanayger',
                        type: 'UnknownToken',
                        suggestions: [{
                            token: 'Schwarzenegger'
                        }]
                    }]
                };
                assert.deepEqual(json, expected);
                done();
            }).
            catch(function(error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
    });
});