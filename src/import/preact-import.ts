import { h, Component, cloneElement } from "preact";

interface IVNode {
    nodeName: Component<any, any>|string;
    attributes: {[name: string]: any};
    children: IVNode[];
    key: string;
}

function findProps(vnode: IVNode) {
    return vnode && vnode.attributes;
}

function findDOMNode(component: Component<any, any>) {
    return component && component.base;
}

declare type Child = IVNode[] | undefined | null;
declare type ChildCallback = (item?: IVNode, index?: number, arr?: IVNode[]) => IVNode[];

const arrayMap = Array.prototype.map;
const arrayForEach = Array.prototype.forEach;
const arraySlice = Array.prototype.slice;

const Children = {
    map(children: Child, callback: ChildCallback, ctx?: any) {
        if (children == null) {
            return null;
        }
        if (ctx && ctx !== children) {
            callback = callback.bind(ctx);
        }
        return arrayMap.call(children, callback);
    },
    forEach(children: Child, callback: ChildCallback, ctx?: any) {
        if (children == null) {
            return null;
        }
        if (ctx && ctx !== children) {
            callback = callback.bind(ctx);
        }
        return arrayForEach.call(children, callback);
    },
    only(children: Child) {
        if (!children || children.length !== 1) {
            throw new TypeError("Children.only() expects only one child.");
        }
        return children[0];
    },
};

export {
    h,
    Component,
    cloneElement,
    Children,
    findProps,
    findDOMNode,
};
