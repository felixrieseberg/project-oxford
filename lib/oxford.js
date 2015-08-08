var face = require('./face'),
	oxford = {};

oxford.Client = function (key) {
	if (!key || key === '') {
		return console.error('Tried to initialize Project Oxford client without API key');
	}
	
	this._key = key;
	this.face = face(key);
}

module.exports = oxford;