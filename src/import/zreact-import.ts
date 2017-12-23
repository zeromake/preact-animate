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

export {
    h,
    Component,
    cloneElement,
    Children,
    findProps,
    findDOMNode,
};
