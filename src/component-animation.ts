/**
 * 使用纯react更新render来更新dom达到动画切换class
 */
import { Component, findProps, findDOMNode, Children, cloneElement } from "react-import";

type voidFun = () => void;

interface IEndCall {
    end: voidFun;
    start: voidFun;
    active: voidFun;
}
interface ITransition {
    active: string;
    name: string;
}

const EVENT_NAME_MAP = {
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

const endEvents = [];

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

function addEndEventListener(props, eventListener) {
    if (endEvents.length === 0) {
        window.setTimeout(eventListener, 0);
        return;
    }
    endEvents.forEach(function _(endEvent) {
        props[`on${endEvent}`] = eventListener;
        // addEventListener(node, endEvent, eventListener);
    });
}

export function cssAnimate(
    component: Component<any, any>,
    transitionName: string | ITransition,
    endCallback: voidFun | IEndCall,
    isAddEvent: boolean,
): any {
    const nameIsObj = typeof transitionName === "undefined" ? "undefined" : typeof transitionName === "object";
    const className = nameIsObj ? (transitionName as ITransition).name : (transitionName as string);
    const activeClassName = nameIsObj ? (transitionName as ITransition).active : transitionName + "-active";
    let end = endCallback;
    let start = void 0;
    let active = void 0;
    if (endCallback && Object.prototype.toString.call(endCallback) === "[object Object]") {
        end = (endCallback as IEndCall).end;
        start = (endCallback as IEndCall).start;
        active = (endCallback as IEndCall).active;
    }
    const child = Children.only(component.props.children);
    const props = findProps(child);
    const oldClass = props.class || props.className;
    const classArr = [];
    if (oldClass) {
        classArr.push(oldClass);
    }
    classArr.push(className);
    let newProps = {};
    component.rcEndListener = function(e) {
        if (component.rcAnimTimeout) {
            clearTimeout(component.rcAnimTimeout);
            component.rcAnimTimeout = null;
        }
        component.setState({
            child: cloneElement(child, {}),
        }, function () {
            component.rcEndListener = null;
            if (end) {
                (end as voidFun)();
            }
        });
    }

    const buildProps = function() {
        return { className: classArr.join(" "), ...newProps };
    };
    addEndEventListener(newProps, component.rcEndListener);
    if (start) {
        start();
    }
    component.setState({
        child: cloneElement(child, buildProps())
    }, function() {
        component.rcAnimTimeout = setTimeout(function _() {
            component.rcAnimTimeout = null;
            classArr.push(activeClassName);
            component.setState({
                child: cloneElement(child, buildProps())
            }, function() {
                if (active) {
                    setTimeout(active, 0);
                }
            });
        }, 30);
    });
    return {
        stop: function stop() {
            if (component.rcEndListener) {
                component.rcEndListener();
            }
        },
    };
}


export const isCssAnimationSupported = endEvents.length !== 0;

