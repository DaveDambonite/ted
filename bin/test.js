Function.prototype.extends = function(parent) {
	this.__super = parent;
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

function Animal(name) {
	if (!(this instanceof Animal)) { return new Animal(name); }

	this.name = name;
}

Animal.prototype.greet = function() {
	console.log("I'm an animal and my name is " + this.name);
};

function Cat(name) {
	if (!(this instanceof Cat)) { return new Cat(name); }
	this.constructor.__super.apply(this, arguments);
}

Cat.extends(Animal);

Cat.prototype.greet = function() {
	console.log("Meow my name is " + this.name);
}

var a = Animal('abe');
var c = new Cat('meowth');

a.greet();
c.greet();

console.log(a instanceof Animal);
console.log(c instanceof Animal);
console.log(a instanceof Cat);
console.log(c instanceof Cat);