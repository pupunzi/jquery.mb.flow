import {Util} from "./Util.js";

/**
 *
 * Description:
 *
 **/
class Element {
	get connectedElements() {
		return this._connectedElements;
	}

	set connectedElements(value) {
		this._connectedElements.push(value);
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

	constructor(type = Type.text) {
		this._id = Util.setUID;
		this._type = type;
		this._nodeId = null;
		this._connectedElements = [];
		this._selected = false;
	}

	connect(cardId){
		let card = window.board.getNodeById(cardId);
		card.connections = this.nodeId;
	}

}

export {Element};
