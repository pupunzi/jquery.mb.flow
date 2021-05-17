/**
 *
 * Description:
 *
 **/
import {Util} from "./Util.js";

export class Connection {
	constructor(connectionLine, fromNodeId, fromNodeElementId, toNodeId, type = 0) {
		this._id = Util.setUID();
		this._connectionLine = connectionLine;
		this._from = fromNodeId;
		this._nodeElementId = fromNodeElementId;
		this._to = toNodeId;
		this._type = type;
	}
}
