/**
 *
 * Description:
 *
 **/

class Util {

	constructor() {
		Array.prototype.Delete = function (el) {
			for (var i = 0; i < this.length; i++) {
				if (this[i] === el) {
					this.splice(i, 1);
					i--;
				}
			}
		}


	}

	static setUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

}


export {Util};
