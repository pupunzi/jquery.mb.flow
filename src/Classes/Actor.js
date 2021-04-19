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
    }

}
