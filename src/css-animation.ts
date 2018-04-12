import ClassList from "./class-list";
import Event from "./Event";
import { isCssAnimationSupported, getAnimationTime, voidFun, IEndCall, ITransition } from "./base-animation";

function fixBrowserByTimeout(node) {
    if (isCssAnimationSupported) {
        const time = getAnimationTime(node);
        // sometimes, browser bug
        node.rcEndAnimTimeout = setTimeout(function _() {
            node.rcEndAnimTimeout = null;
            if (node.rcEndListener) {
                node.rcEndListener();
            }
        }, time * 1000 + 200);
    }
}

function clearBrowserBugTimeout(node) {
    if (node.rcEndAnimTimeout) {
        clearTimeout(node.rcEndAnimTimeout);
        node.rcEndAnimTimeout = null;
    }
}
function cssAnimate(
    node: Element | HTMLElement,
    transitionName: string | ITransition,
    endCallback: voidFun | IEndCall,
    isAddEvent: boolean,
): { stop: voidFun } {
    const nameIsObj = typeof transitionName === "undefined" ? "undefined" : typeof transitionName === "object";
    const className = nameIsObj ? (transitionName as ITransition).name : (transitionName as string);
    const activeClassName = nameIsObj ? (transitionName as ITransition).active : transitionName + "-active";
    let end = endCallback;
    let start = void 0;
    let active = void 0;
    const nodeClasses = new ClassList(node);

    if (endCallback && Object.prototype.toString.call(endCallback) === "[object Object]") {
        end = (endCallback as IEndCall).end;
        start = (endCallback as IEndCall).start;
        active = (endCallback as IEndCall).active;
    }
    if ((node as any).rcEndListener) {
        (node as any).rcEndListener();
    }
    (node as any).rcEndListener = function _(e) {
        if (e && e.target !== node) {
            return;
        }
        if ((node as any).rcAnimTimeout) {
            clearTimeout((node as any).rcAnimTimeout);
            (node as any).rcAnimTimeout = null;
        }
        clearBrowserBugTimeout(node);
        nodeClasses.remove(className);
        nodeClasses.remove(activeClassName);
        if (isAddEvent) {
            Event.removeEndEventListener(node, (node as any).rcEndListener);
        }
        (node as any).rcEndListener = null;
        if (end) {
            (end as voidFun)();
        }
    };
    if (isAddEvent) {
        Event.addEndEventListener(node, (node as any).rcEndListener);
    }
    if (start) {
        start();
    }
    nodeClasses.add(className);
    (node as any).rcAnimTimeout = setTimeout(function _() {
        (node as any).rcAnimTimeout = null;
        nodeClasses.add(activeClassName);
        if (active) {
            setTimeout(active, 0);
        }

        if (isAddEvent) {
            fixBrowserByTimeout(node);
            // 30ms for firefox
        }
    }, 30);
    return {
        stop: function stop() {
            if ((node as any).rcEndListener) {
                (node as any).rcEndListener();
            }
        },
    };
}

export default cssAnimate;
