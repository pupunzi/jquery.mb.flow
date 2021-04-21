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
            $.flow.metaKey = e.key;
        }).on("keyup", () => {
            $.flow.metaKey = null;
        })
    }
}
