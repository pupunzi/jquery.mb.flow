/**
 *
 * Description:
 *
 **/
import {Util} from "./Util.js";

export class Connection {
	constructor(connectionLine, fromNodeId, fromNodeElementId, toNodeId) {
		this._id = Util.setUID();
		this._connectionLine = connectionLine;
		this._from = fromNodeId;
		this._nodeElementId = fromNodeElementId;
		this._to = toNodeId;
	}
}
