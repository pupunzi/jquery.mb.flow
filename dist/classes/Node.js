/**
 *
 * Description:
 * Node Model
 **/

import {Util} from "Util.js";

class Node {
	get connections() {
		return this._connections;
	}

	set connections(value) {
		this._connections = value;
	}

	constructor(type = Type.text) {
		this._id = Util.setUID();
		this._type = type;
		this._elements = [];
		this._count = function () {
			return this.elements.length;
		};
		this._connections = [];
	}

	get elements() {
		return this._elements;
	}

	set elements(value) {
		this._elements.push(value);
	}

	get count() {
		return this._count;
	}

	set count(value) {
		this._count = value;
	}

	get type() {
		return this._type;
	}

	set type(value) {
		this._type = value;
	}

	get id() {
		return this._id;
	}

	deleteElement(id) {
		let el = this.getElementById(id);
		if (el != null)
			this.elements.delete(el);
	}

	getElementById(id) {
		this.elements.forEach((element) => {
			if (element.id === id)
				return element;
		});
		return null;
	}

}

class Type {
	static text = "text";
	static condition = "condition";
	static random = "random";
	static choice = "choice";
}

export {Node};
