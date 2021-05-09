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

    static evaluateVariablesInText(content) {
        //find anything inside {}
        let regExp = /[^{\{]+(?=})/gi;
        let variables = content.match(regExp);
        content = content.replace(regExp,function(m){ return '<b>'+m+'</b>'})

        console.debug(content);

        if (variables)
            variables.forEach((v) => {
                let variables = this.findVariables(v);
                variables.forEach((v) => {
                    content = content.replace(v, "$.flow.flowApp().flow._variables." + v.replace("$",""));
                })
            });
        console.debug(content)
    }

    static findVariables(string) {
        //returns all the words starting with _
        // let regExp = /(\b_\S+\b)/ig;
        let regExp = /\$([\w]+)/gi;
        return string.match(regExp);
    }
}


export {Util};
