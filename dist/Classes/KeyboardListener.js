/**
 *
 * Description:
 *
 **/
export class KeyboardListener {
    constructor() {
        this.init();
    }

    init() {
        $(document).on("keydown.keyboard", (e) => {
            $.flow.metaKeys.push(e.key);
            // console.debug($.flow.metaKeys)
        }).on("keyup", () => {
            $.flow.metaKeys = [];
        });
        $(window).on("blur",()=>{
            $.flow.metaKeys = [];
        });
    }
}

export class KeyType {
    static meta = "Meta";
    static alt = "Alt";
    static shift = "Shift";
    static enter = "Enter";
    static backspace = "Backspace";
    static control = "Control";
    static escape = "Escape";
    static space = " ";

}
