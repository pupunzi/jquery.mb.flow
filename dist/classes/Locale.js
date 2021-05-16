import {Util} from "./Util.js";

export class Locale {
    constructor(code = "EN", desc = "English") {
        this._id = Util.setUID();
        this._code = code;
        this._desc = desc;
    }
}
