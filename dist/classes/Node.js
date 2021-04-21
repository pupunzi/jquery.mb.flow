/**
 *
 * Description:
 * Node Model
 **/

import {Util} from "./Util.js";
import {NodeElement} from "./NodeElement.js";
import {Actor} from "./Actor.js";

export class Node {
	constructor(boardId, type = Type.text) {
		this._id = Util.setUID();
		this._boardId = boardId;
		this._type = type;
		this._elements = [];
		this._x = 50;
		this._y = 50;
		this._count = function () {
			return this.elements.length;
		};
		this._connectToNodeID = null;
		this._actor = new Actor();
		this._date = new Date().getTime();
	}

	get date() {
		return this._date;
	}

	get x() {
		return this._x;
	}

	set x(value) {
		this._x = value;
	}

	get y() {
		return this._y;
	}

	set y(value) {
		this._y = value;
	}

	get actor() {
		return this._actor;
	}

	set actor(value) {
		this._actor = value;
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

	addElement() {
		let nodeElement = new NodeElement(Type.text, this.id);
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

	getNextNodeElement() {

	}
}

export class TextNode extends Node{
		constructor(properties){
			super(properties);
			this._type = Type.text;
		}
}



export class Type {
	static start = "Start";
	static text = "Text";
	static note = "Note";

	static choices = "Choices";

	static condition = "Condition";
	static random = "Random";
	static jumpToNode = "JumpToNode";
}
