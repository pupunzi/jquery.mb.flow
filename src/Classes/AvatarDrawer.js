import {Util} from "./Util.js";
import {UI} from "./UI.js";
import {ActorsDrawer} from "./ActorsDrawer.js";

export class AvatarDrawer {

    static options = {};
    static actor = null;

    static getRandom(key) {
        let path = Object.keys(window.Avataaars.paths[key]);
        let rnd = Math.floor(Math.random() * (path.length - 1));
        return path[rnd];
    }

    static getRandomColor(key) {
        let path = Object.keys(window.Avataaars.colors[key]);
        let rnd = Math.floor(Math.random() * (path.length - 1));
        return path[rnd];
    }

    static randomOptions() {
        return {
            eyes: AvatarDrawer.getRandom("eyes"),
            clothing: AvatarDrawer.getRandom("clothing"),
            hair: "dreads",
            hairColor: AvatarDrawer.getRandomColor("hair"),
            facialHair: AvatarDrawer.getRandom("facialHair"),
            facialHairColor: AvatarDrawer.getRandomColor("hair"),
            accessories: AvatarDrawer.getRandom("accessories"),
            mouth: AvatarDrawer.getRandom("mouth"),
            top: AvatarDrawer.getRandom("top"),
            eyebrows: AvatarDrawer.getRandom("eyebrows"),
            clothingColor: AvatarDrawer.getRandomColor("palette"),
            skin: AvatarDrawer.getRandomColor("skin"),
            background: Util.randomColor()
        }
    }

    static createAvatar = (opt) => {
        let options = opt || AvatarDrawer.randomOptions();
        return window.Avataaars.create(options);
    };

    static openWindow(actorId) {
        let actor = window.flowApp.flow.getActorById(actorId);
        AvatarDrawer.actor = actor;

        let avatarWindow = UI.fillTemplate("avatar-editor", {
            actorName: actor._name,
            actorId: actor._id,
            avatar: window.Avataaars.create(actor._avatar._options),
            color: actor._avatar._options["background"] || "#ffffff"
        });

        $("body").append(avatarWindow);

        avatarWindow = $("#avatar-window");

        AvatarDrawer.options = actor._avatar._options;
        AvatarDrawer.drawOptions();

        $("input[type=color]").on("change", function () {
            AvatarDrawer.options['background'] = $(this).val();
            let avatarBox = avatarWindow.find(".avatar");
            let avatar = AvatarDrawer.createAvatar(AvatarDrawer.options);
            avatarBox.html(avatar);
        });

        let randomize = avatarWindow.find("#randomize");
        randomize.on("click", () => {
            AvatarDrawer.options = AvatarDrawer.randomOptions();
            AvatarDrawer.drawOptions();
            let avatarBox = avatarWindow.find(".avatar");
            let avatar = AvatarDrawer.createAvatar(AvatarDrawer.options);
            avatarBox.html(avatar);
        });

        let update = avatarWindow.find(".update");
        update.on("click", () => {
            AvatarDrawer.update();
        });

        let cancel = avatarWindow.find(".cancel");
        cancel.on("click", () => {
            AvatarDrawer.closeWindow();
        })
    }

    static drawOptions() {
        let avatarWindow = $("#avatar-window");
        let optionsBox = avatarWindow.find(".options");

        let options = "";
        /**
         * eyes
         */
        options += UI.fillTemplate("avatar-option-line", {
            optionName: "skin"
        });
        options += UI.fillTemplate("avatar-option-line", {
            optionName: "top"
        });
        options += UI.fillTemplate("avatar-option-line", {
            optionName: "hairColor"
        });
        options += UI.fillTemplate("avatar-option-line", {
            optionName: "eyebrows"
        });
        options += UI.fillTemplate("avatar-option-line", {
            optionName: "eyes"
        });
        options += UI.fillTemplate("avatar-option-line", {
            optionName: "mouth"
        });
        options += UI.fillTemplate("avatar-option-line", {
            optionName: "facialHair"
        });
        options += UI.fillTemplate("avatar-option-line", {
            optionName: "facialHairColor"
        });
        options += UI.fillTemplate("avatar-option-line", {
            optionName: "accessories"
        });
        options += UI.fillTemplate("avatar-option-line", {
            optionName: "clothing"
        });
        options += UI.fillTemplate("avatar-option-line", {
            optionName: "clothingColor"
        });

        optionsBox.html(options);

        AvatarDrawer.drawOptionsValue("skin", 'skin');
        AvatarDrawer.drawOptionsValue("top");
        AvatarDrawer.drawOptionsValue("hairColor", 'hair');
        AvatarDrawer.drawOptionsValue("eyebrows");
        AvatarDrawer.drawOptionsValue("eyes");
        AvatarDrawer.drawOptionsValue("mouth");
        AvatarDrawer.drawOptionsValue("facialHair");
        AvatarDrawer.drawOptionsValue("facialHairColor", 'hair');
        AvatarDrawer.drawOptionsValue("accessories");
        AvatarDrawer.drawOptionsValue("clothing");
        AvatarDrawer.drawOptionsValue("clothingColor", 'palette');

        $("input[type=color]")[0].value= AvatarDrawer.options["background"];
    }

    static drawOptionsValue(key, color = null) {
        let avatarWindow = $("#avatar-window");
        let optionsBox = avatarWindow.find(".options");
        let pathKey = color ? window.Avataaars.colors[color] : window.Avataaars.paths[key]
        let path = Object.keys(pathKey);
        let select = optionsBox.find("#" + key);
        path.forEach((value) => {
            let opt = $("<option>").attr({
                value: value,
                selected: AvatarDrawer.options[key] === value
            }).html(value);
            select.append(opt);
            select.on("change", function () {
                let key = $(this).data("key");
                let val = $(this).val();
                AvatarDrawer.options[key] = val;
                let avatarBox = avatarWindow.find(".avatar");
                let avatar = AvatarDrawer.createAvatar(AvatarDrawer.options);
                avatarBox.html(avatar);
            })
        })
    }

    static update(){
        AvatarDrawer.actor._avatar._options = AvatarDrawer.options;
        ActorsDrawer.drawActorsList();
        AvatarDrawer.closeWindow();
    }

    static closeWindow(){
        $("#avatar-window").remove();
    }
}
