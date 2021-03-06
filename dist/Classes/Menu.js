/**
 *
 * Description:
 *
 **/

export class Menu {
    constructor(target, items, alignLeft = false) {
        this._target = target;
        this._items = items;
        this._isOpening = false;
        this._alignLeft = alignLeft;

        this.init();
    }

    set items(value) {
        this._items = value;
    }

    get alignLeft() {
        return this._alignLeft;
    }

    init() {
        $("body").on("click.flow", this._target, (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.show(e);

            $("body").on("click.flow", (e) => {
                if ($(e.target).parents(".contextual-menu").length || this._isOpening)
                    return;
                let menu = $(".contextual-menu");
                menu.fadeOut(0, () => {
                    menu.remove();
                });
                e.preventDefault();
                e.stopPropagation();
            });
        });
    }

    show(e) {
        $(".contextual-menu").remove();
        this._isOpening = true;
        this.hide(false);
        let menu = $("<menu>").addClass("contextual-menu").attr("data-target", this._target);
        let itemsContsiner = $("<ul>");

        let i = typeof this._items == "function" ? this._items(e.target) : this._items;

        i.forEach((item) => {
            let line = $("<li>").addClass("contextual-menu-item");
            if (item.className)
                line.addClass(item.className);

            if (!item.name) {
                line.addClass("separator");
            } else {
                let icon = "<i></i>";
                if(item.icon){
                    icon="<i class='icon " + item.icon +"'></i>";
                }

                line.html(icon + " " +item.name);
                if (item.fn)
                    line.on("click", () => {
                        item.fn(e.target, e);
                        this.hide();
                    });

                if (item.hoverFn)
                    line.on("mouseover", (e) => {
                        item.hoverFn(e.target, e);
                    });

                if (item.outFn)
                    line.on("mouseout", (e) => {
                        item.outFn(e.target, e);
                    });

            }
            itemsContsiner.append(line);
        });


        menu.append(itemsContsiner);
        menu.fadeOut(0);
        $("body").after(menu);

        let left = this.alignLeft ? $(e.target).offset().left : $(e.target).offset().left - menu.width() + 30;
        menu.css({
            position: "absolute",
            top: $(e.target).offset().top,
            left: left
        });

        menu.fadeIn(200, () => {
            this._isOpening = false;
        });
    }

    hide(transition = true) {
        $("body").off("click.contextual");
        let menu = $(".contextual-menu[data-target='" + this._target + "']");
        let t = transition ? 200 : 0;
        menu.fadeOut(t, () => {
            menu.remove();
        });
    }
}

export class ContextualMenu {
    constructor(target, items, alignLeft = false) {
        this._target = target;
        this._items = items;
        this._isOpening = false;
        this._alignLeft = alignLeft;

        this.init();
    }

    init() {

        $("body").on("contextmenu.flow", this._target, (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.show(e);

            $("body").on("click.flow, contextmenu.flow", (e) => {
                if ($(e.target).parents(".contextual-menu").length || this._isOpening)
                    return;
                let menu = $(".contextual-menu");
                menu.fadeOut(0, () => {
                    menu.remove();
                });
            });
        });
    }

    show(e) {
        $(".contextual-menu").remove();
        this._isOpening = true;
        this.hide(false);
        let menu = $("<menu>").addClass("contextual-menu").attr("data-target", this._target);
        let itemsContsiner = $("<ul>");

        let i = typeof this._items == "function" ? this._items(e.target) : this._items;

        i.forEach((item) => {
            let line = $("<li>").addClass("contextual-menu-item");

            if (item.className)
                line.addClass(item.className);

            if (!item.name) {
                line.addClass("separator");
            } else {
                let icon = "<i></i>";
                if(item.icon){
                    icon="<i class='icon " + item.icon +"'></i>";
                }

                line.html(icon + " " +item.name);

                if (item.fn)
                    line.on("click", () => {
                        item.fn(e.target, e);
                        this.hide();
                    });

                if (item.hoverFn)
                    line.on("mouseover", (e) => {
                        item.hoverFn(e.target, e);
                    });

                if (item.outFn)
                    line.on("mouseout", (e) => {
                        item.outFn(e.target, e);
                    });

            }
            itemsContsiner.append(line);
        });

        menu.append(itemsContsiner);
        menu.fadeOut(0);
        $("body").after(menu);

        let left = this._alignLeft ? e.clientX : e.clientX - menu.width() + 30;

        menu.css({
            position: "absolute",
            left: left,
            top: e.clientY
        });

        menu.fadeIn(200, () => {
            this._isOpening = false;
        });
    }

    hide(transition = true) {
        $("body").off("click.contextual");
        let menu = $(".contextual-menu[data-target='" + this._target + "']");
        let t = transition ? 200 : 0;
        menu.fadeOut(t, () => {
            menu.remove();
        });
    }
}

export class ClassName {
    static highlight = "highlight";
    static alert = "alert";
    static selected = "selected";
    static listTitle = "listTitle";
    static listElement = "listElement";
}
