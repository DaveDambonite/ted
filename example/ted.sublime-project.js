require('child_process').exec(
	'"bin/ted" ' + 
	'--input "example/ted.sublime-project.ted" ' + 
	'--output "example/ted.sublime-project" ' + 
	'--pretty');