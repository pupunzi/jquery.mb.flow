import {UI} from "./UI.js";
import {Actor, Avatar} from "./Actor.js";
import {AvatarDrawer} from "./AvatarDrawer.js";
import {Util} from "./Util.js";

export class ActorsDrawer {

    static openWindow() {
        $(".flow-overlay").remove();

        let actorsLine = "";
        window.flowApp.flow._actors.forEach((actor) => {
            let actorLine = UI.fillTemplate("actors-line", {
                actorId: actor._id,
                avatar: window.Avataaars.create(actor._avatar._options),
                name: actor._name,
                bio: actor._bio || "",
                color: actor._color
            });
            actorsLine += actorLine;
        });


        let actorsWindow = UI.fillTemplate("actors", {
            actorsLine: actorsLine
        });
        $("body").append(actorsWindow);

        ActorsDrawer.drawActorsList();

        actorsWindow = $(".flow-overlay");

        actorsWindow.find(".addNew").on("click", () => {
            let newActor = new Actor("New Actor", new Avatar(AvatarDrawer.randomOptions()), Util.randomColor());
            window.flowApp.flow._actors.unshift(newActor);
            ActorsDrawer.drawActorsList();
        });

        actorsWindow.find(".cancel").on("click", () => {
            actorsWindow.remove();
            window.flowApp.drawer.drawBoard();
        })
    }

    static drawActorsList() {
        let actorsLine = "";
        window.flowApp.flow._actors.forEach((actor) => {
            let actorLine = UI.fillTemplate("actors-line", {
                actorId: actor._id,
                avatar: window.Avataaars.create(actor._avatar._options),
                name: actor._name,
                bio: actor._bio || "",
                color: actor._color
            });
            actorsLine += actorLine;
        });
        $(".actors-list").html(actorsLine);

        let actorsWindow = $(".flow-overlay");

        actorsWindow.find(".name").on("blur", function () {
            let actorId = $(this).parents(".actors-line").data("actor-id");
            let actor = window.flowApp.flow.getActorById(actorId);
            actor._name = $(this).text();
            window.flowApp.save(window.flowApp.flow._id)
        });

        actorsWindow.find(".bio").on("blur", function () {
            let actorId = $(this).parents(".actors-line").data("actor-id");
            let actor = window.flowApp.flow.getActorById(actorId);
            actor._bio = $(this).text();
            window.flowApp.save(window.flowApp.flow._id)
        });

        actorsWindow.find(".delete").on("click", function () {
            let actorId = $(this).parents(".actors-line").data("actor-id");
            let actor = window.flowApp.flow.getActorById(actorId);

            let opt = {
                title      : "Delete Actor",
                text       : `Are you sure you want to delete "${actor._name}"? <br> All the dialogue nodes that are using "${actor._name}" will result without actor.`,
                inputId    : null,
                inputValue : null,
                okLabel    : "Remove",
                cancelLabel: "Cancel",
                action     : ()=>{
                    window.flowApp.flow.deleteActor(actorId);
                    ActorsDrawer.drawActorsList();
                },
                className  : "alert"
            };
            UI.dialogue(opt);

            window.flowApp.save(window.flowApp.flow._id);
        });

    }
}
