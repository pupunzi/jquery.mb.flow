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
