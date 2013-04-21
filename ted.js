var fs = require('fs');
var util = require('util');

var Token = require('./Token');
var Tokenizer = require('./Tokenizer');

errorx = function(parser, token) { throw {
	message: 'Error: ' + token.line + ':' + token.column + ' Unexpected token ' + token.name + ' (' + token.contents + ')',
	stack: parser._stack };
};

var Tree = function() {
	this.tree = [];
	this.stack = [this.tree];
	this.current = this.tree;
};

Tree.prototype.openObject = function () {
	var a = {};
	this.current.push(a);
	this.current = a;
	this.stack.push(this.current);
};

Tree.prototype.openKey = function(key) {
	this.stack.push(this.current = this.current[key] = []);
};

Tree.prototype.value = function(value) {
	this.current.push(value);
};

Tree.prototype.closeKey = function() {
	this.stack.pop();
	this.current = this.stack[this.stack.length - 1];
};

Tree.prototype.closeObject = function() {
	this.stack.pop();
	this.current = this.stack[this.stack.length - 1];
};

var Parser = function() {
	this._stack = [];
	this.enter('root');

	this.tree = new Tree();
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
	//console.log(token);
	switch (this.state) {
		case 'root':
			if (token.name == 'object open') {
				this.enter('object');
				this.tree.openObject();
			} else if (
				token.name == 'string' ||
				token.name == 'integer' ||
				token.name == 'float') {
				this.tree.value(token.contents);
			} else {
				errorx(this, token);
			}
			break;

		case 'object':
			if (token.name == 'object close') {
				this.leave();
				this.tree.closeObject();
			} else if (token.name == 'key' || token.name == 'string') {
				this.enter('key');
				this.tree.openKey(token.contents);
			} else {
				errorx(this, token);
			}
			break;

		case 'key':
			if (token.name == 'separator') {
				this.leave();
				this.enter('first value');
			} else {
				errorx(this, token);
			}
			break;

		case 'first value':
			if (token.name == 'string' || token.name == 'integer' || token.name == 'float') {
				this.leave();
				this.enter('value');
				this.tree.value(token.contents);
			} else if (token.name == 'object open') {
				this.leave();
				this.enter('value');
				this.enter('object');
				this.tree.openObject();
			} else {
				errorx(this, token);
			}
			break;

		case 'value':
			if (token.name == 'key') {
				this.leave();
				this.enter('key');
				this.tree.closeKey();
				this.tree.openKey(token.contents);
			} else if (token.name == 'integer' || token.name == 'float') {
				this.tree.value(token.contents);
			} else if (token.name == 'string') {
				this.leave();
				this.enter('possible key');
				this.possible_key = token;
			} else if (token.name == 'object open') {
				this.enter('object');
				this.tree.openObject();
			} else if (token.name == 'object close') {
				this.leave();
				this.leave();
				this.tree.closeKey();
				this.tree.closeObject();
			} else {
				errorx(this, token);
			}
			break;

		case 'possible key':
			if (token.name == 'key') {
				this.leave();
				this.enter('key');
				this.tree.value(this.possible_key.contents);
				this.tree.closeKey();
				this.tree.openKey(token.contents);
			} else if (token.name == 'separator') {
				this.leave();
				this.enter('first value');
				this.tree.closeKey();
				this.tree.openKey(this.possible_key);
			} else if (token.name == 'integer' || token.name == 'float') {
				this.leave();
				this.enter('value');
				this.tree.value(this.possible_key.contents);
				this.tree.value(token.contents);
			} else if (token.name == 'string') {
				this.tree.value(this.possible_key.contents);
				this.possible_key = token;
			} else if (token.name == 'object open') {
				this.leave();
				this.enter('value');
				this.enter('object');
				this.tree.value(this.possible_key.contents);
				this.tree.openObject();
			} else if (token.name == 'object close') {
				this.leave();
				this.leave();
				this.tree.value(this.possible_key.contents);
				this.tree.closeKey();
				this.tree.closeObject();
			} else {
				errorx(this, token);
			}
			break;
	}

};

var is = fs.createReadStream('easy_tokenizer.ted', {encoding: 'utf8'});
var tokenizer = new Tokenizer();
var parser = new Parser();

tokenizer.puke = function(token) {
	parser.feed(token);
}

is.on('data', function(data) {
	try {
		tokenizer.feed(data);
	} catch (e) {
		console.error(e);
	}
});

is.on('end', function() {
	try {
		tokenizer.close();
		fs.writeFileSync('easy_tokenizer.json', JSON.stringify(parser.tree.tree, null, 2));
	} catch (e) {
		console.error(e);
	}
});
