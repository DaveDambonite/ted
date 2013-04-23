ted
======

ted, storing data in text form. Heavily inspired by JSON. 

Uses different opening and closing tokens for strings: '[' and ']' so that
they can be nested: [ array[2] = "value"; ] is a single valid string. 

No commas. 

No more array opening, closing they are automatically detected or can be forced
by a double ':':
	{
		a: [JSON equivalent: a: "string"]
		b: [JSON equivalent: b: ["string 1", "string 2"]] [string 2]
		c::
		d:: [JSON equivalent: d: ["string 1"]]
	}
	