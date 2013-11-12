Function.prototype.extends = function(parent) {
	this._super = parent;
	this.prototype = Object.create(parent.prototype, {
		constructor: {
			value: this,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});
	return this;
};

Function.prototype.construct = function(instance, arguments) {
	if (!(instance instanceof this)) { throw Error('Use new when you create an object'); }
	if (this._super) { this._super.apply(instance, arguments); }
};

function Animal(name) {
	Animal.construct(this, arguments);
	this.name = name;
}

Animal.prototype.greet = function() {
	console.log("I'm an animal and my name is " + this.name);
};

Cat.extends(Animal);
function Cat(name) {
	Cat.construct(this, arguments);
}; 

var a = new Animal('abe');
var c = new Cat('meowth');

a.greet();
c.greet();

console.log(a instanceof Animal);
console.log(c instanceof Animal);
console.log(a instanceof Cat);
console.log(c instanceof Cat);