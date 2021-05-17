/**
 *
 * Description:
 *
 **/

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

    static addVariables(string) {
        //find anything inside {}
        let regExp = /[^{\{]+(?=})/gi;
        let variables = string.match(regExp);
       // string = string.replace(regExp,function(m){ return '<b>'+m+'</b>'})
        if (variables)
            variables.forEach((v) => {
                let vs = Util.findVariables(v);
                if(vs)
                    vs.forEach((v) => {
                        let variable = v.replace("$","");
                        if(!window.flowApp.flow._variables[variable])
                            window.flowApp.flow._variables[variable] = null;
/*
                        let c = string.replace(v, "window.flowApp.flow._variables." + variable);
                        c = c.replace(/{/g,"").replace(/}/g,"");
                        eval(c);
*/
                    });
            });
    }

    static findVariables(string) {
        //returns all the words starting with $
        // let regExp = /(\b_\S+\b)/ig;
        let regExp = /\$([\w]+)/gi;
        return string.match(regExp);
    }

    static suggestVariables(editor){
        editor.addEventListener('keyup', feedback);
        editor.addEventListener('click', feedback);

        function feedback () {
            const index = getIndex(this);
            if (index === -1) {
                console.log('no placeholder selected');
            }
            else {
                //todo: show suggestions
                //todo insert at caret selecting
                console.log(`placeholder at index ${index} selected`);
            }
        }

        function getIndex (element) {
            const placeholder = /\{(\w+)\}/g;
            const { value, selectionStart, selectionEnd } = element;

            for (let match; (match = placeholder.exec(value)) !== null;) {
                if (match.index < selectionStart && placeholder.lastIndex > selectionEnd) {
                    return Number(match[1]);
                }
            }
            return -1;
        }
    }
}


export {Util};
