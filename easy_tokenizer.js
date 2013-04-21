var fs = require('fs');
var util = require('util');

var Token = function(tokenizer, name) {
	this.line = tokenizer.line;
	this.column = tokenizer.column;
	this.contents = '';
	this.name = name;
}

var Tokenizer = function() {
	this._stack = [];
	this.line = 1;
	this.column = 1;
	this.enter('root');
}

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
		token.line + ':' + token.column + ' <' + token.name + '> ' + util.inspect(token.contents)
	);
};

Tokenizer.prototype.feed = function(data) {
	console.log('Received data of length ' + data.length);
	for(var i = 0, l = data.length, x = data[0]; i < l; x = data[++i], this.column++) {

		/* Convert CR and CR+LF to LF */
		if (carriage(x)) {
			x = '\n';
			if (i + 1 < l && linefeed(data[i + 1])) { /* TODO: fix this, it doesn't work correctly because of data boundaries */
				i++;
			}
			this.line++; this.column = 1;
		} else if (linefeed(x)) {
			this.line++; this.column = 1;
		}

		switch (this.state) {
			case 'root':
				if (objectOpen(x)) {
					this.puke(new Token(this, 'object open'));
				} else if (objectClose(x)) {
					this.puke(new Token(this, 'object close'));
				} else if (separator(x)) {
					this.puke(new Token(this, 'separator'));
				} else if (identifierStart(x)) {
					this.enter('key');
					this.token = new Token(this, 'key');
					this.token.contents += x;
				} else if (stringOpen(x)) {
					this.enter('string');
					this.token = new Token(this, 'string');
					this.token.depth = 0;
				} else if (numeric(x)) {
					this.enter('integer');
					this.token = new Token(this, 'integer');
					this.token.contents += x;
				} else if (white(x)) {
					// skip
				} else {
					errorx(this, x);
				}
				break;

			case 'key':
				if (identifier(x)) {
					this.token.contents += x;
				} else if (white(x)) {
					this.leave();
					this.puke(this.token);
					this.token = undefined;
				} else if (separator(x)) {
					this.leave();
					this.puke(this.token);
					this.token = undefined;
					this.puke(new Token(this, 'separator'));
				} else {
					errorx(this, x);
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
						this.puke(this.token);
						this.token = undefined;
					}
				} else if (stringEscape(x)) {
					this.enter('string escape')
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

			case 'integer':
				if (white(x) || objectOpen(x) || stringOpen(x)) {
					this.leave();
					this.token.contents = parseInt(this.token.contents);
					this.puke(this.token);
					this.token = undefined;
				} else if (dot(x)) {
					this.leave();
					this.enter('float');
					this.token.contents += x;
					this.token.name = 'float';
				} else if (numeric(x)) {
					this.token.contents += x;
				} else {
					errorx(this, x);
				}
				break;

			case 'float':
				if (white(x) || objectOpen(x) || stringOpen(x)) {
					this.leave();
					this.token.contents = parseFloat(this.token.contents);
					this.puke(this.token);
					this.token = undefined;
				} else if (numeric(x)) {
					this.token.contents += x;
				} else {
					errorx(this, x);
				}
				break;
		}
	}

	if (this.state != 'root') {
		errorx(this, 'EOF');
	}
};

var is = fs.createReadStream('easy_tokenizer.ted', {encoding: 'utf8'});
var p = new Tokenizer();

is.on('data', function(data) {
	try {
		p.feed(data);
	} catch (e) {
		console.error(e);
	}
});
