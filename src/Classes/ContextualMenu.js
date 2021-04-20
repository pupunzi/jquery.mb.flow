/**
 *
 * Description:
 *
 **/

export class ContextualMenu {
	constructor(target, items, alignLeft = false) {
		this._target = target;
		this._items = items;
		this._isOpening = false;
		this._alignLeft = alignLeft;

		this.init();
	}

	get alignLeft() {
		return this._alignLeft;
	}

	set alignLeft(value) {
		this._alignLeft = value;
	}

	init() {
		$("body").on("click", this._target, (e) => {
			e.preventDefault();
			e.stopPropagation();

			this.show(e);

			$("body").on("click.contextual", (e) => {
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
		this._isOpening = true;
		this.hide(false);
		let menu = $("<menu>").addClass("contextual-menu").attr("data-target", this._target);
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

		let left = this._alignLeft ? $(e.target).offset().left : $(e.target).offset().left - menu.width() + 30;
		menu.css({
			position: "absolute",
			top     : $(e.target).offset().top,
			left    : left,
			zIndex  : 100
		});

		menu.fadeIn(200, () => {
			this._isOpening = false;
		});
	}

	hide(transition = true) {
		$("body").off("click.contextual");
		let menu = $(".contextual-menu[data-target='"+ this._target+ "']");
		let t = transition ? 200 : 0;
		menu.fadeOut(t, () => {
			menu.remove();
		});
	}
}
