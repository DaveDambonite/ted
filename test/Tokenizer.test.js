var fs = require('fs');
var util = require('util');

var Tokenizer = require('../lib/Tokenizer');

var is = fs.createReadStream('test/complex.ted', {encoding: 'utf8'});
var tokenizer = new Tokenizer();

tokenizer.puke = function(token) {
	console.log(
		token.line + ':' + token.column + ' <' + token.name + '> ' + util.inspect(token.contents)
	);
};

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
	} catch (e) {
		console.error(e);
	}
});