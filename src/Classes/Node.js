/**
 *
 * Description:
 * Node Model
 **/

import {Util} from "./Util.js";
import {NodeElement} from "./NodeElement.js";

class Node {

	constructor(type = Type.text, boardId) {
		this._id = Util.setUID();
		this._boardId = boardId;
		this._type = type;
		this._elements = [];
		this._x = 0;
		this._y = 0;
		this._count = function () {
			return this.elements.length;
		};
		this._connectToNodeID = null;
		this._date = new Date().getTime();
	}

	get boardId() {
		return this._boardId;
	}

	set boardId(value) {
		this._boardId = value;
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
		this._elements.unshift(nodeElement);
	}

	deleteElement(id) {
		let el = this.getElementById(id);
		if (el != null)
			this.elements.delete(el);
	}

	getElementById(id) {
		let ne = null;
		this.elements.forEach((element) => {
			if (element.id === id)
				ne = element;
		});
		return ne;
	}

	goToNextElement(){

	}

}

class Type {
	static start = "Start";
	static text = "Text";
	static condition = "Condition";
	static random = "Random";
	static choice = "Choice";
	static note = "Note";
}

export {Node};
