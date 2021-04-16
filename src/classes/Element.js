import {Util} from "./Util";

/**
 *
 * Description:
 *
 **/
class Element {

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

	constructor(type) {
		this._id = Util.setUID;
		this._type = type;
		this._card = null;
		this._connectedElement = null;
		this._selected = false;
	}
}

export {Element};
