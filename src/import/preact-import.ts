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
function isArray(obj: any): boolean {
    if (Array.isArray) {
        return Array.isArray(obj);
    }
    return toString.call(obj) === "[object Array]";
}

declare type childType = IVNode|string|number|boolean|null|undefined|void;
declare type Child = childType[] | childType;
declare type ChildCallback = (item?: childType, index?: number, arr?: childType[]) => childType[];

const arrayMap = Array.prototype.map;
const arrayForEach = Array.prototype.forEach;
const arraySlice = Array.prototype.slice;

const Children = {
    map(children: Child, callback: ChildCallback, ctx?: any): childType[] {
        if (children == null) {
            return null;
        }
        if (!isArray(children)) {
            children = [children as childType];
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
        if (!isArray(children)) {
            children = [children as childType];
        }
        if (ctx && ctx !== children) {
            callback = callback.bind(ctx);
        }
        return arrayForEach.call(children, callback);
    },
    count(children: Child): number {
        if (children == null) {
            return 0;
        }
        if (!isArray(children)) {
            return 1;
        }
        return (children as childType[]).length;
    },
    only(children: Child): childType {
        if (children != null && !isArray(children)) {
            return children as childType;
        }
        throw new TypeError("Children.only() expects only one child.");
    },
    toArray(children: Child): childType[] {
        if (children == null) {
            return [];
        } else if (!isArray(children)) {
            return [children as childType];
        }
        return arraySlice.call(children);
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
