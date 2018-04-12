
import { endEvents } from "./base-animation";

function addEventListener(node, eventName, eventListener) {
    node.addEventListener(eventName, eventListener, false);
}
function removeEventListener(node, eventName, eventListener) {
    node.removeEventListener(eventName, eventListener, false);
}

const TransitionEvents = {
    addEndEventListener: function addEndEventListener(node, eventListener) {
        if (endEvents.length === 0) {
            window.setTimeout(eventListener, 0);
            return;
        }
        endEvents.forEach(function _(endEvent) {
            addEventListener(node, endEvent, eventListener);
        });
    },
    endEvents,
    removeEndEventListener: function removeEndEventListener(node, eventListener) {
        if (endEvents.length === 0) {
            return;
        }
        endEvents.forEach(function _(endEvent) {
            removeEventListener(node, endEvent, eventListener);
        });
    },
};

export default TransitionEvents;
