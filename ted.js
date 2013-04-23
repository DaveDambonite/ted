var fs = require('fs');
var util = require('util');
var path = require('path');

var Token = require('./lib/Token');
var Tokenizer = require('./lib/Tokenizer');
var Parser = require('./lib/Parser');

var input_file = process.argv[2]; if (input_file) { input_file = path.normalize(input_file); }
var output_file = process.argv[3]; if (output_file) { output_file = path.normalize(output_file); }

var is = fs.createReadStream(input_file, {encoding: 'utf8'});
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
		if (output_file) {
			fs.writeFileSync(output_file, JSON.stringify(parser.value));
			console.log('Written to "' + output_file + '"')
		} else {
			console.log(JSON.stringify(parser.value, null, 2));
		}
	} catch (e) {
		console.error(e);
	}
});
