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

function Class(name) {
	this[name] = function C(){
		if (!(this instanceof C)) { throw Error(''); }
		console.log(this);
		if (this.constructor._super) { this.constructor._super.apply(this, arguments); }
	};
	return {
		'name': name,
		'this': this,
		'extends': function(parent) {
			this['this'][this['name']].extends(parent);
			this.parent = parent;
			return this;
		},
		'constructor': function(constructor) {
			var c = function C() {
				if (!(this instanceof C)) { throw Error(''); }
				if (this.constructor._super) { this.constructor._super.apply(this, arguments); } //???
				constructor.apply(this, arguments);
			};
			if (this.parent) { c.extends(this.parent); }
			this['this'][this['name']] = c;
		}
	};
}

Class('Animal').constructor(function(name) {
	this.name = name;
});

/*
function Animal(name) {
	if (!(this instanceof Animal)) { return new Animal(name); }

	this.name = name;
}
*/

Animal.prototype.greet = function() {
	console.log("I'm an animal and my name is " + this.name);
};

/*
var Cat = function Cat(name) {
	if (!(this instanceof Cat)) { return new Cat(name); }
	this.constructor.__super.apply(this, arguments);
}.extends(Animal);
*/

Class('Cat').extends(Animal);

/*
Cat.prototype.greet = function() {
	console.log("Meow my name is " + this.name);
}
*/

var a = new Animal('abe');
var c = new Cat('meowth');

a.greet();
c.greet();

console.log(a instanceof Animal);
console.log(c instanceof Animal);
console.log(a instanceof Cat);
console.log(c instanceof Cat);