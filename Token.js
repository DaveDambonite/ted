
module.exports = Token = function(tokenizer, name) {
	this.line = tokenizer.line;
	this.column = tokenizer.column;
	this.contents = '';
	this.name = name;
};
