/**
 *
 * Description:
 *
 **/

export class ContextualMenu {

    constructor(target, items) {
        this._target = target;
        this._items = items;
        this._isOpening = false;

        this.init();
    }

    init() {
        $("body").on("click", this._target, (e) => {
            this.show(e);

            $("body").on("click.contextual", (e) => {
                if($(e.target).parents(".contextual-menu").length || this._isOpening)
                    return;
                this.hide();
            });
        });
    }

    show(e) {
        this._isOpening = true;
        this.hide(false);
        let menu = $("<menu>").addClass("contextual-menu");
        menu.css({
            position: "absolute",
            top: $(e.target).offset().top,
            left: $(e.target).offset().left
        });
        let itemsContsiner = $("<ul>");
        this._items.forEach((item) => {
            let line = $("<li>").addClass("contextual-menu-item");
            if (!item.name) {
                line.addClass("separator");
            } else {
                line.html(item.name);
                line.on("click", () => {
                    item.fn(e.target);
                    this.hide();
                });
            }
            itemsContsiner.append(line);

        });
        menu.append(itemsContsiner);
        menu.fadeOut(0);
        $("body").after(menu);
        menu.fadeIn(200, ()=>{
            this._isOpening = false;
        });
    }

    hide(transition = true){
        $("body").off("click.contextual");
        let menu = $(".contextual-menu");
        let t = transition ? 200 : 0;
        menu.fadeOut(t,()=>{
            menu.remove();
        });
    }
}
