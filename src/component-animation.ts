/**
 * 使用纯react更新render来更新dom达到动画切换class
 */
import { Component, findProps, findDOMNode, Children, cloneElement } from "react-import";
import AnimateChild from "./AnimateChild";
import { endEvents, getAnimationTime, voidFun, IEndCall, ITransition } from "./base-animation";

export function filterProps(props: any, newProps?: any) {
    // const newProps = {};
    if (!newProps) {
        newProps = {};
    }
    for (const name of endEvents) {
        const eventName = `on${name}`;
        if (eventName in props) {
            newProps[eventName] = props[eventName];
            delete props[eventName];
        }
    }
    let oldClass = props.class || props.className;
    const className = newProps.class || newProps.className;
    if (oldClass && className) {
        oldClass += " " + className;
    } else {
        oldClass = oldClass || className;
    }
    if (oldClass) {
        (newProps as any).className = oldClass;
    }
    return newProps;
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
function fixBrowserByTimeout(component: AnimateChild) {
    if (isCssAnimationSupported) {
        const node = findDOMNode(component);
        const time = getAnimationTime(node);
        // sometimes, browser bug
        component.rcEndAnimTimeout = setTimeout(() => {
            component.rcEndAnimTimeout = null;
            if (component.rcEndListener) {
                component.rcEndListener();
            }
        }, time * 1000 + 200);
    }
}
function clearBrowserBugTimeout(component: AnimateChild) {
    if (component.rcEndAnimTimeout) {
        clearTimeout(component.rcEndAnimTimeout);
        component.rcEndAnimTimeout = null;
    }
}

export function componentAnimate(
    component: AnimateChild,
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
    let child = Children.only(component.props.children);
    const props = findProps(child);
    const oldClass = props.class || props.className;
    const classArr = [];
    if (oldClass) {
        classArr.push(oldClass);
    }
    classArr.push(className);
    const newProps = {};
    component.rcEndListener = function rcEndListener(e: Event) {
        if (component.rcAnimTimeout) {
            clearTimeout(component.rcAnimTimeout);
            component.rcAnimTimeout = null;
        }
        clearBrowserBugTimeout(component);
        component.renderFlag = true;
        child = component.lastChilden || child;
        component.lastChilden = null;
        component.setState({
            child,
        }, function __() {
            component.rcEndListener = null;
            if (end) {
                (end as voidFun)();
            }
        });
    };

    const buildProps = () => {
        return { className: classArr.join(" "), ...newProps };
    };
    addEndEventListener(newProps, component.rcEndListener);
    if (start) {
        start();
    }
    component.setState({
        child: cloneElement(child, buildProps()),
    }, () => {
        component.renderFlag = false;
        component.rcAnimTimeout = setTimeout(() => {
            component.rcAnimTimeout = null;
            classArr.push(activeClassName);
            component.renderFlag = true;
            component.setState({
                child: cloneElement(child, buildProps()),
            }, () => {
                if (active) {
                    setTimeout(active, 0);
                }
                component.renderFlag = false;
            });
            if (isAddEvent) {
                fixBrowserByTimeout(component);
                // 30ms for firefox
            }
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
