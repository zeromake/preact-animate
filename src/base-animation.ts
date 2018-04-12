
export type voidFun = () => void;

export interface IEndCall {
    end: voidFun;
    start: voidFun;
    active: voidFun;
}
export interface ITransition {
    active: string;
    name: string;
}

export const EVENT_NAME_MAP = {
    transitionend: {
        transition: "TransitionEnd",
        WebkitTransition: "WebkitTransitionEnd",
        MozTransition: "MozTransitionEnd",
        OTransition: "OTransitionEnd",
        msTransition: "MSTransitionEnd",
    },
    animationend: {
        animation: "AnimationEnd",
        WebkitAnimation: "WebkitAnimationEnd",
        MozAnimation: "MozAnimationEnd",
        OAnimation: "OAnimationEnd",
        msAnimation: "MSAnimationEnd",
    },
};

export const endEvents = [];

function detectEvents() {
    const testEl = document.createElement("div");
    const style = testEl.style;

    if (!("AnimationEvent" in window)) {
        delete EVENT_NAME_MAP.animationend.animation;
    }

    if (!("TransitionEvent" in window)) {
        delete EVENT_NAME_MAP.transitionend.transition;
    }

    for (const baseEventName in EVENT_NAME_MAP) {
        if (EVENT_NAME_MAP.hasOwnProperty(baseEventName)) {
            const baseEvents = EVENT_NAME_MAP[baseEventName];
            for (const styleName in baseEvents) {
                if (styleName in style) {
                    endEvents.push(baseEvents[styleName]);
                    break;
                }
            }
        }
    }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
    detectEvents();
}

export const isCssAnimationSupported = endEvents.length !== 0;

const prefixes = ["-webkit-", "-moz-", "-o-", "ms-", ""];
export function getStyleProperty(node, name) {
    const style = window.getComputedStyle(node, null);
    let ret = "";
    for (const i of prefixes) {
        ret = style.getPropertyValue(i + name);
        if (ret) {
            break;
        }
    }
    return ret;
}

export function getAnimationTime(node: Element): number {
    const transitionDelay = parseFloat(getStyleProperty(node, "transition-delay")) || 0;
    const transitionDuration = parseFloat(getStyleProperty(node, "transition-duration")) || 0;
    const animationDelay = parseFloat(getStyleProperty(node, "animation-delay")) || 0;
    const animationDuration = parseFloat(getStyleProperty(node, "animation-duration")) || 0;
    return Math.max(transitionDuration + transitionDelay, animationDuration + animationDelay);
}
