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
		this._cycleType = CycleType.list;
		this._mood = null;
		this._elements = [];
		this._x = 300;
		this._y = 120;
		this._count = function () {
			return this.elements.length;
		};
		this._connections = [];
		this._actor = new Actor();
		this._date = new Date().getTime();

		this.init();
	}

	get cycleType() {
		return this._cycleType;
	}

	set cycleType(value) {
		this._cycleType = value;
	}
	get mood() {
		return this._mood;
	}

	set mood(value) {
		this._mood = value;
	}

	init(){
		switch (this._type) {
			case Type.text:
			case Type.note:
			case Type.choices:
			case Type.condition:
				let line = new NodeElement(this._type, this._id);
				this.elements.push(line);
				// console.debug("line", line);
				break;
		}
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

	get connections() {
		return this._connections;
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
}



export class Type {
	static start = "Start";
	static text = "Text";
	static note = "Note";

	static choices = "Choice";

	static condition = "Condition";
	static random = "Random";
	static jumpToNode = "JumpToNode";
}

export class CycleType {
	static list = "List";
	static repeat = "Repeat";
	static random = "Random";

	static choices = "Choice";

	static condition = "Condition";
	static random = "Random";
	static jumpToNode = "JumpToNode";
}
