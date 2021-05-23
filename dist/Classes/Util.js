/**
 *
 * Description:
 *
 **/

import {Variable, VariableType} from "./Variable.js";

class Util {

    static setUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static randomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    static selectElementContents(el) {
        let range = document.createRange();
        range.selectNodeContents(el);
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    static sanitize(content) {
        return content.replace(/<div>/gi, '<br>').replace(/<\/div>/gi, '')
    }

    static parseVariables(string) {
        //find anything inside {}
        let regExp = /[^{\{]+(?=})/gi;
        let variableBlocks = string.match(regExp);
        // string = string.replace(regExp,function(m){ return '<b>'+m+'</b>'})
        let str = string;
        if (variableBlocks) {
            variableBlocks.forEach((v) => {
                let vs = Util.findVariables(v);
                if (vs)
                    vs.forEach((v) => {
                        str = str.replace(v, "$.flow.vars." + v.replace("$", ""));
                        v = v.replace("$", "");
                        if (!window.flowApp.flow._variables[v]) {
                            window.flowApp.flow._variables[v] = new Variable(v, VariableType.int);
                        }
                    });
            });
            return str;
        }
        return null
    }

    static findVariables(string) {
        //returns all the words starting with $
        let regExp = /\$([\w]+)/gi;
        return string.match(regExp);
    }

}


export {Util};
