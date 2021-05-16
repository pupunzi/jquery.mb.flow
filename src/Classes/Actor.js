import {Util} from "./Util.js";

/**
 *
 * Description:
 *
 **/
export class Actor {
    constructor(name = "System", avatar = new Avatar(), color = Util.randomColor()) {
        this._id = Util.setUID();
        this._name = name;
        this._bio = "";
        this._avatar = avatar;
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
        return this._avatar;
    }

    set icon(value) {
        this._avatar = value;
    }
}

export class Avatar {
    constructor(options = null) {
        this._options = options || {
            eyes: "wink",
            clothing: "hoodie",
            hair: "dreads",
            hairColor: "blonde"
        }
    }

}
