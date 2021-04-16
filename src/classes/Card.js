/**
 *
 * Description:
 * Card Model
 **/

import {Util} from "Util.js";


class Card {

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

	constructor(type) {
		this._id = Util.setUID();
		this._type = type;
		this._elements = [];
		this._count = function () {
			return this.elements.length;
		};
		this._connectedElement
	}

	deleteElement(el) {
		this.elements.Delete(el);
	}


}

class element {
	get type() {
		return this._type;
	}

	set type(value) {
		this._type = value;
	}

	get id() {
		return this._id;
	}

	constructor(type, count) {
		this._id = Util.setUID;
		this._type = type;
	}

}

export {Card};
