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
        $(window).on("keydown", (e) => {
            $.flow.metaKeys.push(e.key);
        }).on("keyup", () => {
            $.flow.metaKeys = [];
        });

        $(window).on("blur",()=>{
            $.flow.metaKeys = [];
        });
    }
}
