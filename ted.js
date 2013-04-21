var fs = require('fs');
var util = require('util');

var Token = require('./Token');
var Tokenizer = require('./Tokenizer');

var Parser = function() {
	this._stack = [];
	this.enter('root');
};

Parser.prototype.enter = function(state) {
	this._stack.push(state);
	return this.state = state;
};

Parser.prototype.leave = function() {
	this._stack.pop();
	return this.state = this._stack[this._stack.length - 1];
};

Parser.prototype.feed = function(token) {

};

var is = fs.createReadStream('easy_tokenizer.ted', {encoding: 'utf8'});
var tokenizer = new Tokenizer();
var parser = new Parser();

tokenizer.puke = function(token) {
	parser.feed(token);
}

is.on('data', function(data) {
	try {
		p.feed(data);
	} catch (e) {
		console.error(e);
	}
});
