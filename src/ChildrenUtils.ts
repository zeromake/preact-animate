import { h } from "preact";

export function forEach(arr: any[] | undefined, callback) {
    if (!arr) {
        return;
    }
    Array.prototype.forEach.call(arr, callback);
}
export function arrayMap(arr: any[] | undefined, callback) {
    if (!arr) {
        return null;
    }
    Array.prototype.map.call(arr, callback);
}
export function findChildInChildrenByKey(children, key) {
    let ret = null;
    forEach(children, (child) => {
        if (ret) {
            return;
        }
        if (child && child.key === key) {
            ret = child;
        }
    });
    return ret;
}

export function findShownChildInChildrenByKey(children, key, showProp) {
    let ret = null;
    forEach(children, (child) => {
        if (child && child.key === key && child.attributes[showProp]) {
            if (ret) {
                throw new Error("two child with same key for <Animate> children");
            }
            ret = child;
        }
    });
    return ret;
}

export function findHiddenChildInChildrenByKey(children, key, showProp) {
    let found = false;
    forEach(children, (child) => {
        if (found) {
            return;
        }
        found = child && child.key === key && !child.attributes[showProp];
    });
    return found;
}

export function isSameChildren(c1, c2, showProp) {
    let same = c1.length === c2.length;
    if (same) {
        forEach(c1, (child, index) => {
            const child2 = c2[index];
            if (child && child2) {
                if ((child && !child2) || (!child && child2)) {
                    same = false;
                } else if (child.key !== child2.key) {
                    same = false;
                } else if (showProp && child.attributes[showProp] !== child2.attributes[showProp]) {
                    same = false;
                }
            }
        });
    }
    return same;
}

export function mergeChildren(prev, next) {
    let ret = [];

    // For each key of `next`, the list of keys to insert before that key in
    // the combined list
    const nextChildrenPending = {};
    let pendingChildren = [];
    forEach(prev, (child) => {
        if (child && findChildInChildrenByKey(next, child.key)) {
            if (pendingChildren.length) {
                nextChildrenPending[child.key] = pendingChildren;
                pendingChildren = [];
            }
        } else {
            pendingChildren.push(child);
        }
    });

    forEach(next, (child) => {
        if (child && nextChildrenPending.hasOwnProperty(child.key)) {
            ret = ret.concat(nextChildrenPending[child.key]);
        }
        ret.push(child);
    });

    ret = ret.concat(pendingChildren);

    return ret;
}

const VNode = h("a", null).constructor;

export function isValidElement(element) {
    return element && (element instanceof VNode);
}
