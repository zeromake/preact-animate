import { h, Children, findProps } from "react-import";

export function arrayMap(children: any[] | undefined, callback: (item: any, index?: number, arr?: any[]) => any, ctx?: any) {
    if (children == null) {
        return null;
    }
    if (ctx && ctx !== children) {
        callback = callback.bind(ctx);
    }
    return Array.prototype.map.call(children, callback);
}
export function forEach(children: any[] | undefined, callback: (item: any, index?: number, arr?: any[]) => any, ctx?: any) {
    if (children == null) {
        return null;
    }
    if (ctx && ctx !== children) {
        callback = callback.bind(ctx);
    }
    return Array.prototype.forEach.call(children, callback);
}

export function findChildInChildrenByKey(children, key) {
    let ret = null;
    forEach(children, (child) => {
        if (ret) {
            return;
        }
        const childKey = child && child.key;
        if (childKey && childKey === key) {
            ret = child;
        }
    });
    return ret;
}

export function findShownChildInChildrenByKey(children, key, showProp) {
    let ret = null;
    forEach(children, (child) => {
        const childKey = child && child.key;
        if (childKey && childKey === key && findProps(child)[showProp]) {
            if (ret) {
                throw new TypeError("two child with same key for <Animate> children");
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
        const childKey = child && child.key;
        found = childKey && childKey === key && !findProps(child)[showProp];
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
                } else if (showProp && findProps(child)[showProp] !== findProps(child2)[showProp]) {
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
        const childKey = child && child.key;
        if (child && findChildInChildrenByKey(next, childKey)) {
            if (pendingChildren.length) {
                nextChildrenPending[childKey] = pendingChildren;
                pendingChildren = [];
            }
        } else {
            pendingChildren.push(child);
        }
    });

    forEach(next, (child) => {
        const childKey = child && child.key;
        if (child && nextChildrenPending.hasOwnProperty(childKey)) {
            ret = ret.concat(nextChildrenPending[childKey]);
        }
        ret.push(child);
    });
    ret = ret.concat(pendingChildren);

    return ret;
}

export function isValidElement(element) {
    return element && element.hasOwnProperty('nodeName');
}

export function isChildrenShow(child, children, showProp, key, flag = false) {
    const has = child && findChildInChildrenByKey(children, key);
    let status = false;
    if (showProp) {
        const showInNow = findProps(child)[showProp];
        if (has) {
            const showInNext = findShownChildInChildrenByKey(children, key, showProp);
            if (flag) {
                if (showInNext && showInNow) {
                    status = true;
                }
            } else {
                if (!showInNext && showInNow) {
                    status = true;
                }
            }
        } else if (showInNow) {
            status = true;
        }
    } else if (!has) {
        status = true;
    }
    return status;
}
