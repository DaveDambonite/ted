errorx = function(parser, token) { throw {
	message: 'Error: ' + token.line + ':' + token.column + ' Unexpected token ' + token.name + ' (' + token.contents + ')',
	stack: parser._stack };
};

module.exports = Parser = function() {
	this._stack = [];
	this.enter('root1');
	this.value = undefined;
};

Parser.prototype.enter = function(state) {
	this.state = {name: state};
	this._stack.push(this.state);
	return this.state;
};

Parser.prototype.leave = function() {
	this._stack.pop();
	return this.state = this._stack[this._stack.length - 1];
};

Parser.prototype.feed = function(token) {
	switch (this.state.name) {
		case 'root1':
			if (token.name == 'literal') {
				this.leave();
				this.enter('root2');
				this.state.value1 = token.contents;
				this.value = this.state.value1; // set parse result
			} else if (token.name == 'object open') {
				this.leave();
				this.enter('root2');
				var o = {};
				this.state.value1 = o;
				this.enter('object');
				this.state.value = o;
				this.value = o; // set parse result
			} else {
				errorx(this, token);
			}
			break;

		// expects: value1
		case 'root2':
			var value1 = this.state.value1;
			if (token.name == 'literal') {
				this.leave();
				this.enter('root');
				this.state.value = [value1, token.contents];
				this.value = this.state.value; // set parse result
			} else if (token.name == 'object open') {
				this.leave();
				this.enter('root');
				var o = {};
				this.state.value = [value1, o];
				this.value = this.state.value; // set parse result
				this.enter('object');
				this.state.value = o;
			} else {
				errorx(this, token);
			}
			break;

		// expects: value = [...]
		case 'root':
			if (token.name == 'literal') {
				this.state.value.push(token.contents);
			} else if (token.name == 'object open') {
				var o = {};
				this.state.value.push(o);
				this.enter('object');
				this.state.value = o;
			} else {
				errorx(this, token);
			}
			break;

		// expects: value = {...}
		case 'object':
			if (token.name == 'key') {
				this.enter('first value');
				this.state.key = token.contents;
			} else if (token.name == 'array key') {
				this.enter('array');
				this.state.key = token.contents;
				this.state.value = [];
			} else if (token.name == 'object close') {
				this.leave();
			} else {
				errorx(this, token);
			}
			break;

		// expects: key
		case 'first value':
			var key = this.state.key;
			if (token.name == 'literal') {
				this.leave();
				this.enter('second value');
				this.state.key = key;
				this.state.value1 = token.contents;
			} else if (token.name == 'object open') {
				this.leave();
				this.enter('second value');
				this.state.key = key;
				var o = {};
				this.state.value1 = o;
				this.enter('object');
				this.state.value = o;
			} else {
				errorx(this, token);
			}
			break;

		// expects: key, value1
		case 'second value':
			var key = this.state.key;
			var value1 = this.state.value1;
			if (token.name == 'key') {
				this.leave();
				this.state.value[key] = value1;
				this.enter('first value');
				this.state.key = token.contents;
			} else if (token.name == 'array key') {
				this.leave();
				this.state.value[key] = value1;
				this.enter('array');
				this.state.key = token.contents;
				this.state.value = [];
			} else if (token.name == 'literal') {
				this.leave();
				this.enter('array');
				this.state.key = key;
				this.state.value = [value1, token.contents];
			} else if (token.name == 'object open') {
				this.leave();
				this.enter('array');
				this.state.key = key;
				var o = {};
				this.state.value = [value1, o];
				this.enter('object');
				this.state.value = o;
			} else if (token.name == 'object close') {
				this.leave();
				this.state.value[key] = value1;
				this.leave();
			} else {
				errorx(this, token);
			}
			break;

		// expects: key, value = [...]
		case 'array':
			var key = this.state.key;
			var value = this.state.value;
			if (token.name == 'key') {
				this.leave();
				this.state.value[key] = value;
				this.enter('first value');
				this.state.key = token.contents;
			} else if (token.name == 'array key') {
				this.leave();
				this.state.value[key] = value;
				this.enter('array');
				this.state.key = token.contents;
				this.state.value = [];
			} else if (token.name == 'literal') {
				this.state.value.push(token.contents);
			} else if (token.name == 'object open') {
				var o = {};
				this.state.value.push(o);
				this.enter('object');
				this.state.value = o;
			} else if (token.name == 'object close') {
				this.leave();
				this.state.value[key] = value;
				this.leave();
			} else {
				errorx(this, token);
			}
			break;

	}
};