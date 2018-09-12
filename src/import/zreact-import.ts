import { h, Component, cloneElement, Children, findDOMNode } from "zreact";

interface IVNode {
    nodeName: Component<any, any>|string;
    attributes: {[name: string]: any};
    children: IVNode[];
    key: string;
}

function findProps(vnode: IVNode) {
    return vnode && vnode.attributes;
}

function isValidElement(element): boolean {
    return element && element.hasOwnProperty("nodeName");
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
