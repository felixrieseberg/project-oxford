var assert   = require('assert'),
    _Promise = require('bluebird'),
    oxford   = require('../dist/oxford'),
    client   = new oxford.Client(process.env.OXFORD_EMOTION_KEY);

function getHighestEmotion(response) {
    var result = [];
    for (var i = 0; i < response.length; i++) {
        var highestEmotion;
        var highestScore = 0;
        for (var emotion in response[0].scores) {
            var score = response[0].scores[emotion];
            if (score > highestScore) {
                highestScore = score;
                highestEmotion = emotion;
            }
        }
        result.push(highestEmotion);
    }
    return result;
}

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
            assert.deepEqual(getHighestEmotion(response), ['happiness']);
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
            assert.deepEqual(getHighestEmotion(response), ['sadness']);
            done();
        })
    });

    it('analyzes a local image blob', function (done) {
        this.timeout(30000);
        client.emotion.analyzeEmotion({
            data: oxford.makeBuffer('data:image/jpeg;base64,' +
                '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABALDA4MChAODQ4SERATGCkbGBYWGDIkJh4pOzQ+PTo0' +
                'OThBSV5QQUVZRjg5Um9TWWFkaWppP09ze3Jmel5naWX/2wBDARESEhgVGDAbGzBlQzlDZWVlZWVl' +
                'ZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWX/wgARCABnAGQDAREA' +
                'AhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAQIDBAUABv/EABcBAQEBAQAAAAAAAAAAAAAAAAAB' +
                'AgP/2gAMAwEAAhADEAAAAdWwQRUhroCzIaeXjiSooEcZVZwoDTNNJJohG1EgS5FmeCW/NXJcnWN4' +
                'flsr0S9+SHS+XsGdbmOlyxUhXP3zvQ4SzuLBPNS6HLr1GVLnQIbJN85FJNqLBMKDz6kvNMGJbO3y' +
                'Y5ZN5AYglzefWTOq9lmzpbqSs8AftzFNBM/G6vPoupaWaKOsaGstHE3TPBhwmNz6R53IIidOdXWZ' +
                'KkjaopJKphmXEmN2s7lqn14qEB6epBY84URYYvTUVlayYAD1VIeeiAjOBD0kNUgAHrKrJVAA4445' +
                'WQgAbC//xAAlEAACAgEDBAMBAQEAAAAAAAABAgADERASFAQTITEgIjNBIzT/2gAIAQEAAQUCJ85m' +
                'Zmd3B7yxb1Y7jAfgvo623EmYglFvxGvV2+d20IpaU9OTH6YEMChpsD1bpmZi+tLv2FTNKUwuQJ3V' +
                'MtRbF6X62CYmIvrSz/oBxN7zJZVZwVXMFYRxqvrTq69lq+YE81YWNtEFk9wLMTEX1pcu+tfrGbM8' +
                '5T6hDuizMzMxfWgl1f2ijZA2YwljFWBzqvoT3rfhbA4neAhtLy0/5hp3DEvaJ5XR3CLb1paFjuWz' +
                'V7MwQwHzV+Ylli1i+42topwU9PaYIJ/f7T+VtoqrawvD8EOCTkj4U/lfR3TwpwpwZwZwZwZwZwpw' +
                'pwpwZWuE/8QAHBEAAgMBAQEBAAAAAAAAAAAAAREAIDAQAhIx/9oACAEDAQE/AdBorKARRYqzjjoO' +
                'OixUXFDcQVOAPFFz0Y447eTT1+0Fgbi/1CXUajUT/8QAHREAAwEBAQEAAwAAAAAAAAAAAAERIBAw' +
                'AhIxQP/aAAgBAgEBPwEpcXtL1+VLx4pS9pS8fbqEJh6vpRbY8PlKXLXKUZ8o/EiItfSx8/rya9oJ' +
                'T+aEIQmv/8QAJRAAAQIFAgcBAAAAAAAAAAAAAAERAhAgITIwQRIiMVFhcYED/9oACAEBAAY/AqLq' +
                'ZDJFpND0oaJdDgSfMWGVBFrj9yS0rHkihrX3Ny3QdRVTevj2UeTLuct9FpMZGKqOzaLoku5usoV2' +
                'LaDJR9l1O483iUb87J3HLzbahJcx4odF+DJTCKu46rpwmRkZGRkZGRkZGRkZCIf/xAAlEAEAAgED' +
                'BAIDAQEAAAAAAAABABExECFBUWFx8SChgZGx0eH/2gAIAQEAAT8hS28t1lurF9YmimVZNTLlO5FX' +
                'Mt6st6st6sTGTo7FsZY3Me83wU94pnDhYCYhfOlTH8xy6LuqOZwcsT2iC7QnD6RhuiHzJs/Fjl0b' +
                'ueEC2Id4XOYwVVmKHaOwqhVfgfLox7MCN49gOkt+BmUCh4aQBHfLxM34HL50pCdabPRxMhtYbIOO' +
                'F0hu2IArijLy+gc+dLw5nAmJRpsRrKyp1jMwvKLf4D+kOfMxBzHzQ5gFRWotuXiO6/ZBqD/nUMiv' +
                'gcvMN2u/md6nMhhk2jBCr2hR2YDygmrh09UOTvAqJqhL4PsRVqrLGAuG2xHdMHbS+8oj68OfMtC/' +
                'EuDtwNcgWdIg/cIAeTLqsDH0JnSnYiDaWK9GOrQIYi5hi59aLu0DiVu/5lfWV9ZX1lfWB9ZW/wDM' +
                'rVfzAesS/wDMp6zsRP/aAAwDAQACAAMAAAAQmTLXqSC7ANnmEWpICXmbRQ7iNMxRiL/gCr9AYb0E' +
                'wStjd8i/KWCQi5QnOEl7r+hSQjV7Nu2kwpZ9ygpttsJNH//EAB0RAAMAAwEBAQEAAAAAAAAAAAAB' +
                'ERAhMSBRMEH/2gAIAQMBAT8QSpCY2RkGhEIQ4F7YiEZQheEzPqNGOBLZCEwsp2JREw1UcKKKELHR' +
                'YJhvR3DWN+ELCcYt7wegl9w4IQghYZJ7NDRWNr6J1YQhMLKps6hfTJQmSZZRQheP4iY2ij8ZrwXh' +
                'OFekG0kN13yXpMvYL9XClKUpSlKUuH//xAAcEQADAAMBAQEAAAAAAAAAAAAAAREQICExQTD/2gAI' +
                'AQIBAT8QbmSlLhS5KP8AEyoggepwMJkJ0b4PIXi0NUWsqKhOPEkEYePBKRCQnhPUtGPDVQ+cKJ96' +
                'OfMPRSlGPCVcOswSMTmgXiHl15iMimukaU9PoQVwuUQx6NUj5hJti4pox7NXsGPZbM9ITYEIQgz/' +
                'xAAhEAEAAgICAgMBAQAAAAAAAAABABEhMUFRYXGBkaGxEP/aAAgBAQABPxDdO55cYwzaV6r3MhIN' +
                'z0kB5hRdpVlf6RZJbxXLuD7oEoiAG1iK1sHMara73HJTKelN8RS5gcCUSLh3BUq+IZE3+0/dKmjQ' +
                'Wx3K62teiVcNPLB+XYO4BpvD3FZCVjmPSJ08jKLuUlLI7v5Z+qEfmrcg2qLq4DkJmOQRUd4DaEIG' +
                'AseZYHa3zcsBdy3bDMyzAHlj+kCGqbYJemCWRLurZghXbXhAL/OX8xypvrEsrJSXUGAQCyf3ZUAR' +
                '1LYg0yxBpHwiUYXN4iTShm9MICAcl4hWHrCXI/Yob3DuhcZgpHlgzII9fdweYaYjsdRB8hUJFoGA' +
                '5lw+7YbeuAphaPEp3KSlkyXtN5XS4224FPBaJaDh4l+M3RbB9+wAH1MrgxG1zs9weLZe5T3KbJ/d' +
                'g3YGXggUf43iUWtqLxOgmokAi7jaT6gNY+YBgkmngeZf2EXEqEVKhQD75hnGVtvUA88K5jU6dyqI' +
                '4ZQmZZfAwh4i5Xyy0AwfyAUyXwmZw/KIYG2PLhxbohQJxGDcHJ2h0bYtlpAXBNU5PUpdy1KNRXdg' +
                'IOp+DEUYDuY1DvcSglZJcGmCpYqXZTER1Ki3cWHEQVyR1Ztn4f8AIBU1KXAGHTxC7d4VbvGHeFec' +
                'BbvDab5gPJgJlMBOcAVbahbm61c//9k=')
        })
        .then(function (response) {
            assert.ok(response);
            assert.equal(response.length, 1);
            assert.ok(response[0].faceRectangle);
            assert.deepEqual(getHighestEmotion(response), ['happiness']);
            done();
        })
    });
});
