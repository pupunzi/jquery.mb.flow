
/* =============================================================
 * bootstrap-typeahead.js v3.0.0
 * http://twitter.github.com/bootstrap/javascript.html#typeahead
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function($){

    "use strict"; // jshint ;_;


    /* TYPEAHEAD PUBLIC CLASS DEFINITION
     * ================================= */

    var Typeahead = function (element, options) {
        this.$element = $(element);
        this.options = $.extend({}, $.fn.typeahead.defaults, options);
        this.matcher = this.options.matcher || this.matcher;
        this.sorter = this.options.sorter || this.sorter;
        this.highlighter = this.options.highlighter || this.highlighter;
        this.updater = this.options.updater || this.updater;
        this.blur = this.options.blur || this.blur;
        this.source = this.options.source;
        this.$menu = $(this.options.menu);
        this.shown = false;
        this.listen()
    };

    Typeahead.prototype = {

        constructor: Typeahead

        , select: function () {
            var val = this.$menu.find('.active').attr('data-value');
            this.$element
                .val(this.updater(val))
                .text(this.updater(val))
                .change();
            return this.hide()
        }

        , updater: function (item) {
            return item
        }

        , show: function () {
            var pos = $.extend({}, this.$element.position(), {
                height: this.$element[0].offsetHeight
            });

            this.$menu
                .insertAfter(this.$element)
                .css({
                    top: pos.top + pos.height
                    , left: pos.left
                })
                .show();

            this.shown = true;
            return this
        }

        , hide: function () {
            this.$menu.hide();
            this.shown = false;
            return this
        }

        , lookup: function (event) {
            var items;

            this.query = this.$element.is("input") ? this.$element.val() : this.$element.text();

            if (!this.query || this.query.length < this.options.minLength) {
                return this.shown ? this.hide() : this
            }

            items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source;

            return items ? this.process(items) : this
        }

        , process: function (items) {
            var that = this;

            items = $.grep(items, function (item) {
                return that.matcher(item)
            });

            items = this.sorter(items);

            if (!items.length) {
                return this.shown ? this.hide() : this
            }

            return this.render(items.slice(0, this.options.items)).show()
        }

        , matcher: function (item) {
            return ~item.toLowerCase().indexOf(this.query.toLowerCase())
        }

        , sorter: function (items) {
            var beginswith = []
                , caseSensitive = []
                , caseInsensitive = []
                , item;

            while (item = items.shift()) {
                if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item);
                else if (~item.indexOf(this.query)) caseSensitive.push(item);
                else caseInsensitive.push(item)
            }

            return beginswith.concat(caseSensitive, caseInsensitive)
        }

        , highlighter: function (item) {
            var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
            return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                return '<strong>' + match + '</strong>'
            })
        }

        , render: function (items) {
            var that = this;

            items = $(items).map(function (i, item) {
                i = $(that.options.item).attr('data-value', item);
                i.find('a').html(that.highlighter(item));
                return i[0]
            });

            items.first().addClass('active');
            this.$menu.html(items);
            return this
        }

        , next: function (event) {
            var active = this.$menu.find('.active').removeClass('active')
                , next = active.next();

            if (!next.length) {
                next = $(this.$menu.find('li')[0])
            }

            next.addClass('active')
        }

        , prev: function (event) {
            var active = this.$menu.find('.active').removeClass('active')
                , prev = active.prev();

            if (!prev.length) {
                prev = this.$menu.find('li').last()
            }

            prev.addClass('active')
        }

        , listen: function () {
            this.$element
                .on('focus',    $.proxy(this.focus, this))
                .on('blur',     $.proxy(this.blur, this))
                .on('keypress', $.proxy(this.keypress, this))
                .on('keyup',    $.proxy(this.keyup, this));

            if (this.eventSupported('keydown')) {
                this.$element.on('keydown', $.proxy(this.keydown, this))
            }

            this.$menu
                .on('click', $.proxy(this.click, this))
                .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
                .on('mouseleave', 'li', $.proxy(this.mouseleave, this))
        }

        , eventSupported: function(eventName) {
            var isSupported = eventName in this.$element;
            if (!isSupported) {
                this.$element.setAttribute(eventName, 'return;');
                isSupported = typeof this.$element[eventName] === 'function'
            }
            return isSupported
        }

        , move: function (e) {
            if (!this.shown) return;

            switch(e.keyCode) {
                case 9: // tab
                case 13: // enter
                case 27: // escape
                    e.preventDefault();
                    break;

                case 38: // up arrow
                    e.preventDefault();
                    this.prev();
                    break;

                case 40: // down arrow
                    e.preventDefault();
                    this.next();
                    break
            }

            e.stopPropagation()
        }

        , keydown: function (e) {
            this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27]);
            this.move(e)
        }

        , keypress: function (e) {
            if (this.suppressKeyPressRepeat) return;
            this.move(e)
        }

        , keyup: function (e) {
            switch(e.keyCode) {
                case 40: // down arrow
                case 38: // up arrow
                case 16: // shift
                case 17: // ctrl
                case 18: // alt
                    break;

                case 9: // tab
                case 13: // enter
                    if (!this.shown) return;
                    this.select();
                    break;

                case 27: // escape
                    if (!this.shown) return;
                    this.hide();
                    break;

                default:
                    this.lookup()
            }

        }

        , focus: function (e) {
            this.focused = true
        }

        , blur: function (e) {
            this.focused = false;
            if (!this.mousedover && this.shown) this.hide()
        }

        , click: function (e) {
            e.stopPropagation();
            e.preventDefault();
            this.select();
            this.$element.focus()
        }

        , mouseenter: function (e) {
            this.mousedover = true;
            this.$menu.find('.active').removeClass('active');
            $(e.currentTarget).addClass('active')
        }

        , mouseleave: function (e) {
            this.mousedover = false;
            if (!this.focused && this.shown) this.hide()
        }

    };


    /* TYPEAHEAD PLUGIN DEFINITION
     * =========================== */

    var old = $.fn.typeahead;

    $.fn.typeahead = function (option) {
        return this.each(function () {
            var $this = $(this)
                , data = $this.data('typeahead')
                , options = typeof option == 'object' && option;
            if (!data) $this.data('typeahead', (data = new Typeahead(this, options)));
            if (typeof option == 'string') data[option]()
        })
    };

    $.fn.typeahead.defaults = {
        source: []
        , items: 8
        , menu: '<ul class="typeahead dropdown-menu"></ul>'
        , item: '<li><a href="#"></a></li>'
        , minLength: 1
    };

    $.fn.typeahead.Constructor = Typeahead;


    /* TYPEAHEAD NO CONFLICT
     * =================== */

    $.fn.typeahead.noConflict = function () {
        $.fn.typeahead = old;
        return this
    };


    /* TYPEAHEAD DATA-API
     * ================== */

    $(document).on('focus.typeahead.data-api', '[data-provide="typeahead"]', function (e) {
        var $this = $(this);
        if ($this.data('typeahead')) return;
        $this.typeahead($this.data())
    })

}(window.jQuery);


/* FORKED from
 * =============================================================
 * tagAutocomplete.js v0.1
 * http://sandglaz.github.com/bootstrap-tagautocomplete
 * =============================================================
 * Copyright 2013 Sandglaz, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */

!function ($) {

    "use strict"; // jshint ;_;


    /* TAGAUTOCOMPLETE PUBLIC CLASS DEFINITION
     * =============================== */

    var Tagautocomplete = function (element, options) {
        $.fn.typeahead.Constructor.call(this, element, options);
        this.after = this.options.after || this.after;
        this.show = this.options.show || this.show
    };

    /* NOTE: TAGAUTOCOMPLETE EXTENDS BOOTSTRAP-TYPEAHEAD.js
       ========================================== */

    Tagautocomplete.prototype = $.extend({}, $.fn.typeahead.Constructor.prototype, {

        constructor: Tagautocomplete

        , select: function () {
            var val = this.$menu.find('.active').attr('data-value');
            var offset = val.length - this.length_of_query;
            var position = getCaretPosition(this.$element[0]) + offset;

            var text = this.$element.text();
            text = text.slice(0, position - offset - this.length_of_query) + val.substring(0, val.length) + this.suffix + text.substring(position - offset, text.length);
            this.$element.text(text);

            this.$element.change();
            this.after();

            setCaretPosition(this.$element[0], position + this.suffix.length);

            return this.hide();
        }

        , after: function () {

        }

        , show: function () {

            var pos = this.$element.position();
            var height = this.$element[0].offsetHeight;

            this.$menu
                .appendTo('body')
                .show()
                .css({
                    position: "absolute",
                    top: pos.top + height + "px",
                    left: pos.left + "px"
                });

            this.shown = true;
            return this
        }

        , extractor: function () {
            var query = this.query;
            var position = getCaretPosition(this.$element[0]);
            query = query.substring(0, position);
            var regex = new RegExp("(^|\\s)(\\" + this.options.tag + "[\\w-]*)$");
            var result = regex.exec(query);
            if (result && result[2])
                return result[2].trim().toLowerCase().substr(this.options.tag.length);
            return '';
        }

        , updater: function (item) {
            return item + ' ';
        }

        , matcher: function (item) {
            var tquery = this.extractor();
            if (!tquery) return false;

            // Set values that will be needed by select() here, because mouse clicks can change them
            this.length_of_query = tquery.length;
            this.suffix = this.options.suffix;

            return ~item.toLowerCase().indexOf(tquery)
        }

        , highlighter: function (item) {
            var query = this.extractor().replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
            return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                return '<strong>' + match + '</strong>'
            })
        }

    });


    /* TAGAUTOCOMPLETE PLUGIN DEFINITION
     * ======================= */

    var old = $.fn.tagautocomplete;

    $.fn.tagautocomplete = function (option) {
        return this.each(function () {
            var $this = $(this)
                , data = $this.data('tagautocomplete')
                , options = typeof option == 'object' && option;
            if (!data) $this.data('tagautocomplete', (data = new Tagautocomplete(this, options)));
            if (typeof option == 'string') data[option]()
        })
    };

    $.fn.tagautocomplete.Constructor = Tagautocomplete;

    $.fn.tagautocomplete.defaults = $.extend($.fn.typeahead.defaults, {
        tag: '@',
        suffix: ''
    });


    /* TAGAUTOCOMPLETE NO CONFLICT
     * =================== */

    $.fn.tagautocomplete.noConflict = function () {
        $.fn.tagautocomplete = old;
        return this
    }

}(window.jQuery);


/* =============================================================
 * caret-position.js v1.0.0
 * =============================================================
 * Copyright 2013 Sandglaz, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */
(function($) {
    function focus(target) {
        if (!document.activeElement || document.activeElement !== target) {
            target.focus();
        }
    }
    $.fn.caret = function(pos) {
        var target = this[0];
        var isContentEditable = target && target.contentEditable === 'true';
        if (arguments.length === 0) {
            //get
            if (target) {
                //HTML5
                if (window.getSelection) {
                    //contenteditable
                    if (isContentEditable) {
                        focus(target);
                        var selection = window.getSelection();
                        // Opera 12 check
                        if (!selection.rangeCount) {
                            return 0;
                        }
                        var range1 = selection.getRangeAt(0),
                            range2 = range1.cloneRange();
                        range2.selectNodeContents(target);
                        range2.setEnd(range1.endContainer, range1.endOffset);
                        return range2.toString().length;
                    }
                    //textarea
                    return target.selectionStart;
                }

                // Addition for jsdom support
                if (target.selectionStart)
                    return target.selectionStart;
            }
            //not supported
            return;
        }
        //set
        if (target) {
            if (pos === -1)
                pos = this[isContentEditable? 'text' : 'val']().length;
            //HTML5
            if (window.getSelection) {
                //contenteditable
                if (isContentEditable) {
                    focus(target);
                    window.getSelection().collapse(target.firstChild, pos);
                }
                //textarea
                else
                    target.setSelectionRange(pos, pos);
            }

            if (!isContentEditable)
                focus(target);
        }
        return this;
    }
})(jQuery);

function getCaretPosition(containerEl) {
    return $(containerEl).caret();
}

function setCaretPosition(containerEl, index) {
    $(containerEl).caret(index);
}
