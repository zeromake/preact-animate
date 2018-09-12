import { createElement as h, Component, cloneElement, Children, isValidElement } from "react";
import { findDOMNode } from "react-dom";

interface IVNode {
    type: Component<any, any>|string;
    props: {[name: string]: any};
    children: IVNode[];
}

function findProps(vnode: IVNode) {
    return vnode && vnode.props;
}

function PolyfillLifecycle(component: any): void {
}

export {
    h,
    Component,
    cloneElement,
    Children,
    findProps,
    findDOMNode,
    isValidElement,
    PolyfillLifecycle,
};
