import {Util} from "./Util.js";
import {Type} from "./Node.js";

class NodeElement {

	constructor(type = Type.text, nodeId) {
		this._id = Util.setUID;
		this._type = type;
		this._nodeId = nodeId;
		this._connectedTo = null;
		this._selected = false;
	}

	get connectedElement() {
		return this._connectedTo;
	}

	set connectedElement(nodeId) {
		this._connectedTo = nodeId;
	}

	get nodeId() {
		return this._nodeId;
	}

	set nodeId(value) {
		this._nodeId = value;
	}

	get selected() {
		return this._selected;
	}

	set selected(value) {
		this._selected = value;
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

export {NodeElement};
