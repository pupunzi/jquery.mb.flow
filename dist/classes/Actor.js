import {Util} from "./Util.js";

/**
 *
 * Description:
 *
 **/
export class Actor {

    constructor(name = "System", icon = null, color = null) {
        this._id = Util.setUID();
        this._name = name;
        this._icon = icon;
        this._color = color;
    }

    get color() {
        return this._color;
    }

    set color(value) {
        this._color = value;
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


    get icon() {
        return this._icon;
    }

    set icon(value) {
        this._icon = value;
    }
}
