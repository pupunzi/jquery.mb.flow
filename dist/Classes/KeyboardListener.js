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
        }).on("keyup", () => {
            $.flow.metaKeys = [];
        });
        $(window).on("blur",()=>{
            $.flow.metaKeys = [];
            $(".node").draggable("enable");
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
    static alt = "Alt";

}
