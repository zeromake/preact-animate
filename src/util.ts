import { Component } from "preact";

const util = {
    isAppearSupported(props: any) {
        return props.transitionName && props.transitionAppear || props.animation.appear;
    },
    isEnterSupported(props: any) {
        return props.transitionName && props.transitionEnter || props.animation.enter;
    },
    isLeaveSupported(props: any) {
        return props.transitionName && props.transitionLeave || props.animation.leave;
    },
    allowAppearCallback(props: any) {
        return props.transitionAppear || props.animation.appear;
    },
    allowEnterCallback(props: any) {
        return props.transitionEnter || props.animation.enter;
    },
    allowLeaveCallback(props: any) {
        return props.transitionLeave || props.animation.leave;
    },
    findDOMNode(component: Component<any, any>) {
        if (!(component as any).base && (component as any).vdom) {
            return component && (component as any).vdom && (component as any).vdom.base || component;
        } else {
            return (component as any).base || component;
        }
    },
};
export default util;
