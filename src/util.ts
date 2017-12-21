import preact, { Component } from "preact";

export function isAppearSupported(props: any, transitionName: any) {
    return (transitionName || props.transitionName) && props.transitionAppear || props.animation.appear;
}
export function isEnterSupported(props: any, transitionName: any) {
    return (transitionName || props.transitionName) && props.transitionEnter || props.animation.enter;
}
export function isLeaveSupported(props: any, transitionName: any) {
    return (transitionName || props.transitionName) && props.transitionLeave || props.animation.leave;
}
export function isDisappearSupported(props: any, transitionName: any) {
    return (transitionName || props.transitionName) && props.transitionDisappear || props.animation.disappear;
}
export function allowAppearCallback(props: any) {
    return props.transitionAppear || props.animation.appear;
}
export function allowEnterCallback(props: any) {
    return props.transitionEnter || props.animation.enter;
}
export function allowLeaveCallback(props: any) {
    return props.transitionLeave || props.animation.leave;
}
export function findDOMNode(component: Component<any, any>) {
    if (typeof preact.findDOMNode === "function") {
        return preact.findDOMNode(component);
    } else {
        return (component as any).base || component;
    }
}
export function addDisplyNone(component: any) {
    const node = findDOMNode(component);
    if (node && node.style) {
        if (node.style.display && node.style.display !== "") {
            component.displayCss = node.style.display;
        }
        node.style.display = "none";
    }
}
export function removeDisplyNone(component: any) {
    const node = findDOMNode(component);
    if (node && node.style) {
        if (component.displayCss && component.displayCss !== "" && component.displayCss !== "none") {
            node.style.display = component.displayCss;
        } else {
            node.style.display = "";
        }
    }
}
export function isDisplyShow(props, childProps) {
    return props.showProp && (!props.disableShow && !childProps.disableShow);
}

export default {
    isAppearSupported,
    isEnterSupported,
    isDisappearSupported,
    isLeaveSupported,
    allowAppearCallback,
    allowEnterCallback,
    allowLeaveCallback,
    findDOMNode,
    addDisplyNone,
    removeDisplyNone,
    isDisplyShow,
};
// export default util;
