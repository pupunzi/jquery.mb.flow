import {Util} from "./Util.js";

/**
 *
 * Description:
 *
 **/
export class Actor {

    constructor(name = "Actor") {
        this._id = Util.setUID();
        this._name = name;
        this._icon = null;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get icon() {
        return this._icon;
    }

    set icon(value) {
        this._icon = value;
    }
}
