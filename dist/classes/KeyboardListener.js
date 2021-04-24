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
        $(document).on("keydown", (e) => {
            $.flow.metaKeys.push(e.key);
            //console.debug($.flow.metaKeys)
        }).on("keyup", () => {
            $.flow.metaKeys = [];
        })
    }
}
