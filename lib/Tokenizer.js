var util = require('util');

var Token = require('./Token');

module.exports = Tokenizer = function() {
	this._stack = [];
	this.line = 1;
	this.column = 1;
	this.enter('root');
};

objectOpen = function(x) { return x == '{'; };
objectClose = function(x) { return x == '}'; };
separator = function(x) { return x == ':'; };
stringOpen = function(x) { return x == '['; };
stringClose = function(x) { return x == ']'; };
stringEscape = function(x) { return x == '\\'; }
linewhite = function(x) { return x == ' ' || x == '\t'; };
carriage = function(x) { return x == '\r'; };
linefeed = function(x) { return x == '\n'; };
white = function(x) { return linewhite(x) || linefeed(x); };
dot = function(x) { return x == '.'; }
identifierStart = function(x) { return /[a-zA-Z_\-]/.test(x); }
identifier = function(x) { return /[a-zA-Z0-9_\-]/.test(x); }
numeric = function(x) { return /[0-9]/.test(x); }
errorx = function(tokenizer, x) { throw {
	message: 'Unexpected character: ' + escape(x), 
	line: tokenizer.line, 
	column: tokenizer.column, 
	stack: tokenizer._stack };
};

Tokenizer.prototype.enter = function(state) {
	this._stack.push(state);
	return this.state = state;
};

Tokenizer.prototype.leave = function() {
	this._stack.pop();
	return this.state = this._stack[this._stack.length - 1];
};

Tokenizer.prototype.puke = function(token) {
	console.log(
		token.line + ':' + token.column + '\t <' + token.name + '>\t ' + util.inspect(token.contents)
	);
};

Tokenizer.prototype.feed = function(data) {

	var last_was_carriage = false;

	for(var i = 0, l = data.length, x = data[0]; i < l; x = data[++i], this.column++) {

		/* Convert CR and CR+LF to LF */

		if (carriage(x)) {
			x = '\n';
			this.line++; this.column = 0;
			last_was_carriage = true;
		} else if (linefeed(x)) {
			if (last_was_carriage) {
				last_was_carriage = false;
				continue; // skip \n of \r\n
			} else {
				this.line++; this.column = 0;
			}
		} else {
			if (last_was_carriage) {
				last_was_carriage = false;
			}
		}

		var redo;
		do {
			redo = false;
			switch (this.state) {
				case 'root':
					if (objectOpen(x)) {
						this.puke(new Token(this, 'object open'));
					} else if (objectClose(x)) {
						this.puke(new Token(this, 'object close'));
					} else if (identifierStart(x)) {
						this.enter('key');
						this.token = new Token(this, 'key');
						this.token.contents += x;
					} else if (stringOpen(x)) {
						this.enter('string');
						this.token = new Token(this, 'literal');
						this.token.depth = 0;
					} else if (numeric(x)) {
						this.enter('integer');
						this.token = new Token(this, 'literal');
						this.token.contents += x;
					} else if (white(x)) {
						// skip
					} else {
						errorx(this, x);
					}
					break;

				case 'separator':
					if (separator(x)) {
						this.leave();
						this.token.name = 'array key';
						this.puke(this.token);
						this.token = undefined;
					} else {
						this.leave();
						this.puke(this.token);
						redo = true;
					}
					break;

				case 'key':
					if (identifier(x)) {
						this.token.contents += x;
					} else {
						this.leave();
						// creating states for these is tedious :/
						if (this.token.contents == 'true') {
							this.token.name = 'literal';
							this.token.contents = true;
						} else if (this.token.contents == 'false') {
							this.token.name = 'literal';
							this.token.contents = false;
						} else if (this.token.contents == 'undefined') {
							this.token.name = 'literal';
							this.token.contents = undefined;
						} else if (this.token.contents == 'null') {
							this.token.name = 'literal';
							this.token.contents = null;
						} else {
							this.enter('key ended');
							redo = true;
							break;
						}
						this.puke(this.token);
						redo = true;
					}
					break;

				case 'key ended':
					if (separator(x)) {
						this.leave();
						this.enter('separator');
					} else if (white(x)) {
						// skip
					} else {
						errorx(this, x); // we expect a key to be followed by a separator
					}
					break;
				
				case 'string':
					if (stringOpen(x)) {
						this.token.depth++;
						this.token.contents += x;
					} else if (stringClose(x)) {
						if (this.token.depth > 0) {
							this.token.depth--;
							this.token.contents += x;
						} else {
							this.leave();
							this.enter('string ended');
						}
					} else if (stringEscape(x)) {
						this.enter('string escape');
					} else {
						this.token.contents += x;
					}
					break;

				case 'string escape': 
					if (stringOpen(x)) {
						this.leave();
						this.token.contents += '[';
					} else if (stringClose(x)) {
						this.leave();
						this.token.contents += ']';
					} else if (x == 'n') {
						this.leave();
						this.token.contents += "\n";
					} else if (x == 't') {
						this.leave();
						this.token.contents += "\t";
					} else if (x == "\\") {
						this.leave();
						this.token.contents += "\\";
					} else {
						errorx(this, x);
					}
					break;

				case 'string ended':
					if (separator(x)) {
						this.leave();
						this.enter('separator');
						this.token.name = 'key';
					} else if (white(x)) {
						// skip
					} else {
						this.leave();
						this.puke(this.token);
						redo = true;
					}
					break;

				case 'integer':
					if (numeric(x)) {
						this.token.contents += x;
					} else if (dot(x)) {
						this.leave();
						this.enter('float');
						this.token.name = 'literal';
						this.token.contents += x;
					} else {
						this.leave();
						this.token.contents = parseInt(this.token.contents);
						this.puke(this.token);
						this.token = undefined;
						redo = true;
					}
					break;

				case 'float':
					if (numeric(x)) {
						this.token.contents += x;
					} else {
						this.leave();
						this.token.contents = parseFloat(this.token.contents);
						this.puke(this.token);
						this.token = undefined;
						redo = true;
					}
					break;
			}
		} while (redo);
	}
};

Tokenizer.prototype.close = function() {
	if (this.state != 'root') {
		errorx(this, 'EOF');
	}
}