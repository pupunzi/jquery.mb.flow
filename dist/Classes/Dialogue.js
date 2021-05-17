/**
 *
 * Description:
 *
 **/
import {Util} from "./Util.js";

export class Dialogue {
    constructor(title, text = "", okLabel = "Ok" ) {
        this._id = Util.setUID();
        this._title = title;
        this._text = text;
        this._okLabel = okLabel;
        this._actions = [];
    }
}

export class DialogueAction {
    constructor(){

    }
}
