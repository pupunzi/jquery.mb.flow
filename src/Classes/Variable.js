/**
 *
 * Description:
 *
 **/
import {Util} from "./Util.js";

export class Variable {
    constructor(key,type){
        this._id= Util.setUID();
        this._type = type;
        this._key = key;
        this._value = type === VariableType.string? "" : type === VariableType.int || type === VariableType.float ? 0 : false ;
    }
}

export class VariableType {
    static bool = "bool";
    static string = "string";
    static int = "int";
    static float = "float"

}
