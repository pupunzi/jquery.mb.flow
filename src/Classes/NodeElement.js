import {Util} from "./Util.js";
import {Type} from "./Node.js";

class NodeElement {

	/*
	* Possible types:
	* text
	* condition
	* */
	constructor(type = Type.text, nodeId) {
		this._id = Util.setUID();
		this._type = type;
		this._nodeId = nodeId;
		this._localizedContents = [];
		this._selected = false;
	}

	get content() {
		return this._content;
	}

	set content(value) {
		this._content = value;
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

class NodeElementContent {
	constructor(languageCode,) {
		this._languageCode = languageCode;
		this._content;
	}


}

export {NodeElement};
