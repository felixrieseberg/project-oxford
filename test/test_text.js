var assert   = require('assert'),
    _Promise = require('bluebird'),
    oxford   = require('../dist/oxford'),
    client   = new oxford.Client(process.env.OXFORD_SPELL_KEY);

describe('Project Oxford Text API Test', function () {
    afterEach(function() {
        // delay after each test to prevent throttling
        var now = +new Date() + 1000;
        while(now > +new Date());
    });

    describe('#spellCheck', function() {
        it('Spell check a word without additional context, no case correction', function(done) {
            client.text.spellCheck('Bill Gatas').
            then(function(json) {
                assert.equal(json.flaggedTokens.length, 1);
                var token = json.flaggedTokens[0];
                assert.equal(token.offset, 5);
                assert.equal(token.token, 'Gatas');
                assert.equal(token.type, 'UnknownToken');
                assert.equal(token.suggestions.length, 1);
                var suggestion = token.suggestions[0];
                assert.equal(suggestion.suggestion, 'gates');
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
                assert.equal(json.flaggedTokens.length, 1);
                var token = json.flaggedTokens[0];
                assert.equal(token.offset, 0);
                assert.equal(token.token, 'Too');
                assert.equal(token.type, 'UnknownToken');
                assert.equal(token.suggestions.length, 1);
                var suggestion = token.suggestions[0];
                assert.equal(suggestion.suggestion, 'To');
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
                assert.equal(json.flaggedTokens.length, 1);
                var token = json.flaggedTokens[0];
                assert.equal(token.offset, 7);
                assert.equal(token.token, 'shuwartsanayger');
                assert.equal(token.type, 'UnknownToken');
                assert.equal(token.suggestions.length, 1);
                var suggestion = token.suggestions[0];
                assert.equal(suggestion.suggestion, 'Schwarzenegger');
                done();
            }).
            catch(function(error) {
                assert.ok(false, JSON.stringify(error));
                done();
            });
        });
    });
});
