ted
======

ted, storing data in text form. Heavily inspired by JSON. 

{
	key: [string value]
	myint: 1
	[My hex]: 0x01
	freaky_booleans: true
	list: [String] 1 [Yes that was a number] 2 4
	another_complex_object: {
		child: [element]
	}
	escaping: [escaping brackets, only if they don't match in the string: [] doesnt have to be escaped]
}

root
	-> object
	-> list
	-> key

object
	-> key

key
	-> colon

colon
	-> object
	-> string
	-> integer
	-> float
	-> hex

string
	-> string
	-> integer
	-> float
	-> hex
	-> key
	-> colon

