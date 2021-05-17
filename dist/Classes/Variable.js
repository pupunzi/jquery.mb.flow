/**
 *
 * Description:
 *
 **/
import {Util} from "./Util.js";

export class Variable {
    constructor(){
        this._id= Util.setUID();
        this._key;
        this._value;
    }
}
