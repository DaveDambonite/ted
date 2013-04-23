
var fs = require('fs');
var util = require('util');
var path = require('path');

var argv = require('optimist').argv;

// check if an input file is provided
if (!argv.input) {
	console.log('Must specify input (-i <filepath> | --input <filepath)');
}

var Token = require('../lib/Token');
var Tokenizer = require('../lib/Tokenizer');
var Parser = require('../lib/Parser');

var is;
try {
	is = fs.createReadStream(argv.input, {encoding: 'utf8'});
} catch (e) {
	console.error(e);
}

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
		var output = argv.pretty ?
			JSON.stringify(parser.value, null, 2) :
			JSON.stringify(parser.value);

		if (argv.output) {
			fs.writeFileSync(argv.output, output);
			console.log('Written to "' + output_file + '"')
		} else {
			console.log(output);
		}
	} catch (e) {
		console.error(e);
	}
});
