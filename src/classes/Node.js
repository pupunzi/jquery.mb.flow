/**
 *
 * Description:
 * Node Model
 **/

import {Util} from "Util.js";
import {NodeElement} from "./NodeElement.js";

class Node {

	constructor(type = Type.text) {
		this._id = Util.setUID();
		this._type = type;
		this._elements = [];
		this._count = function () {
			return this.elements.length;
		};
		this._connectToNodeID = null;
	}

	get connection() {
		return this._connectToNodeID;
	}

	set connection(value) {
		this._connectToNodeID = value;
	}

	get elements() {
		return this._elements;
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

	addElement(){
		let nodeElement = new NodeElement(Type.text);
		this._elements.push(nodeElement);
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

	let
	goToNextElement(){

	}

}

class Type {
	static text = "text";
	static condition = "condition";
	static random = "random";
	static choice = "choice";
}

export {Node};
