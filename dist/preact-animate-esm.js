import preact, { Component, cloneElement, h } from 'preact';

const __assign = Object.assign || function (target) {
    for (var source, i = 1; i < arguments.length; i++) {
        source = arguments[i];
        for (var prop in source) {
            if (Object.prototype.hasOwnProperty.call(source, prop)) {
                target[prop] = source[prop];
            }
        }
    }
    return target;
};

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function findChildInChildrenByKey(children, key) {
    var ret = null;
    if (children) {
        children.forEach(function (child) {
            if (ret) {
                return;
            }
            if (child && child.key === key) {
                ret = child;
            }
        });
    }
    return ret;
}
function findShownChildInChildrenByKey(children, key, showProp) {
    var ret = null;
    if (children) {
        children.forEach(function (child) {
            if (child && child.key === key && child.attributes[showProp]) {
                if (ret) {
                    throw new Error("two child with same key for <Animate> children");
                }
                ret = child;
            }
        });
    }
    return ret;
}

function isSameChildren(c1, c2, showProp) {
    var same = c1.length === c2.length;
    if (same) {
        c1.forEach(function (child, index) {
            var child2 = c2[index];
            if (child && child2) {
                if ((child && !child2) || (!child && child2)) {
                    same = false;
                }
                else if (child.key !== child2.key) {
                    same = false;
                }
                else if (showProp && child.attributes[showProp] !== child2.attributes[showProp]) {
                    same = false;
                }
            }
        });
    }
    return same;
}
function mergeChildren(prev, next) {
    var ret = [];
    // For each key of `next`, the list of keys to insert before that key in
    // the combined list
    var nextChildrenPending = {};
    var pendingChildren = [];
    prev.forEach(function (child) {
        if (child && findChildInChildrenByKey(next, child.key)) {
            if (pendingChildren.length) {
                nextChildrenPending[child.key] = pendingChildren;
                pendingChildren = [];
            }
        }
        else {
            pendingChildren.push(child);
        }
    });
    next.forEach(function (child) {
        if (child && nextChildrenPending.hasOwnProperty(child.key)) {
            ret = ret.concat(nextChildrenPending[child.key]);
        }
        ret.push(child);
    });
    ret = ret.concat(pendingChildren);
    return ret;
}
var VNode = h("a", null).constructor;
function isValidElement(element) {
    return element && (element instanceof VNode);
}

var re = /\s+/;
var toString = Object.prototype.toString;
var index = function _(arr, obj) {
    if (arr.indexOf) {
        return arr.indexOf(obj);
    }
    for (var i = 0; i < arr.length; ++i) {
        if (arr[i] === obj) {
            return i;
        }
    }
    return -1;
};
var ClassList = /** @class */ (function () {
    function ClassList(node) {
        if (!node || !node.nodeType) {
            throw new Error("A DOM element reference is required");
        }
        this.el = node;
        this.list = node.classList;
    }
    ClassList.prototype.add = function (name) {
        // classList
        if (this.list) {
            this.list.add(name);
            return this;
        }
        // fallback
        var arr = this.array();
        var i = index(arr, name);
        if (i === -1) {
            arr.push(name);
        }
        this.el.className = arr.join(" ");
        return this;
    };
    ClassList.prototype.remove = function (name) {
        if ("[object RegExp]" === toString.call(name)) {
            return this.removeMatching(name);
        }
        // classList
        if (this.list) {
            this.list.remove(name);
            return this;
        }
        // fallback
        var arr = this.array();
        var i = index(arr, name);
        if (i !== -1) {
            arr.splice(i, 1);
        }
        this.el.className = arr.join(" ");
        return this;
    };
    ClassList.prototype.removeMatching = function (pre) {
        var arr = this.array();
        for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
            var i = arr_1[_i];
            if (pre.test(i)) {
                this.remove(i);
            }
        }
        return this;
    };
    ClassList.prototype.array = function () {
        var className = this.el.getAttribute("class") || "";
        var str = className.replace(/^\s+|\s+$/g, "");
        var arr = str.split(re);
        if ("" === arr[0]) {
            arr.shift();
        }
        return arr;
    };
    return ClassList;
}());

var EVENT_NAME_MAP = {
    transitionend: {
        transition: "transitionend",
        WebkitTransition: "webkitTransitionEnd",
        MozTransition: "mozTransitionEnd",
        OTransition: "oTransitionEnd",
        msTransition: "MSTransitionEnd",
    },
    animationend: {
        animation: "animationend",
        WebkitAnimation: "webkitAnimationEnd",
        MozAnimation: "mozAnimationEnd",
        OAnimation: "oAnimationEnd",
        msAnimation: "MSAnimationEnd",
    },
};
var endEvents = [];
function detectEvents() {
    var testEl = document.createElement("div");
    var style = testEl.style;
    if (!("AnimationEvent" in window)) {
        delete EVENT_NAME_MAP.animationend.animation;
    }
    if (!("TransitionEvent" in window)) {
        delete EVENT_NAME_MAP.transitionend.transition;
    }
    for (var baseEventName in EVENT_NAME_MAP) {
        if (EVENT_NAME_MAP.hasOwnProperty(baseEventName)) {
            var baseEvents = EVENT_NAME_MAP[baseEventName];
            for (var styleName in baseEvents) {
                if (styleName in style) {
                    endEvents.push(baseEvents[styleName]);
                    break;
                }
            }
        }
    }
}
if (typeof window !== "undefined" && typeof document !== "undefined") {
    detectEvents();
}
function addEventListener(node, eventName, eventListener) {
    node.addEventListener(eventName, eventListener, false);
}
function removeEventListener(node, eventName, eventListener) {
    node.removeEventListener(eventName, eventListener, false);
}
var TransitionEvents = {
    addEndEventListener: function addEndEventListener(node, eventListener) {
        if (endEvents.length === 0) {
            window.setTimeout(eventListener, 0);
            return;
        }
        endEvents.forEach(function _(endEvent) {
            addEventListener(node, endEvent, eventListener);
        });
    },
    endEvents: endEvents,
    removeEndEventListener: function removeEndEventListener(node, eventListener) {
        if (endEvents.length === 0) {
            return;
        }
        endEvents.forEach(function _(endEvent) {
            removeEventListener(node, endEvent, eventListener);
        });
    },
};

var isCssAnimationSupported = TransitionEvents.endEvents.length !== 0;
var prefixes = ["-webkit-", "-moz-", "-o-", "ms-", ""];
function getStyleProperty(node, name) {
    var style = window.getComputedStyle(node, null);
    var ret = "";
    for (var _i = 0, prefixes_1 = prefixes; _i < prefixes_1.length; _i++) {
        var i = prefixes_1[_i];
        ret = style.getPropertyValue(i + name);
        if (ret) {
            break;
        }
    }
    return ret;
}
function fixBrowserByTimeout(node) {
    if (isCssAnimationSupported) {
        var transitionDelay = parseFloat(getStyleProperty(node, "transition-delay")) || 0;
        var transitionDuration = parseFloat(getStyleProperty(node, "transition-duration")) || 0;
        var animationDelay = parseFloat(getStyleProperty(node, "animation-delay")) || 0;
        var animationDuration = parseFloat(getStyleProperty(node, "animation-duration")) || 0;
        var time = Math.max(transitionDuration + transitionDelay, animationDuration + animationDelay);
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
function cssAnimate(node, transitionName, endCallback) {
    var nameIsObj = typeof transitionName === "undefined" ? "undefined" : typeof transitionName === "object";
    var className = nameIsObj ? transitionName.name : transitionName;
    var activeClassName = nameIsObj ? transitionName.active : transitionName + "-active";
    var end = endCallback;
    var start = void 0;
    var active = void 0;
    var nodeClasses = new ClassList(node);
    if (endCallback && Object.prototype.toString.call(endCallback) === "[object Object]") {
        end = endCallback.end;
        start = endCallback.start;
        active = endCallback.active;
    }
    if (node.rcEndListener) {
        node.rcEndListener();
    }
    node.rcEndListener = function _(e) {
        if (e && e.target !== node) {
            return;
        }
        if (node.rcAnimTimeout) {
            clearTimeout(node.rcAnimTimeout);
            node.rcAnimTimeout = null;
        }
        clearBrowserBugTimeout(node);
        nodeClasses.remove(className);
        nodeClasses.remove(activeClassName);
        TransitionEvents.removeEndEventListener(node, node.rcEndListener);
        node.rcEndListener = null;
        if (end) {
            end();
        }
    };
    TransitionEvents.addEndEventListener(node, node.rcEndListener);
    if (start) {
        start();
    }
    nodeClasses.add(className);
    node.rcAnimTimeout = setTimeout(function _() {
        node.rcAnimTimeout = null;
        nodeClasses.add(activeClassName);
        if (active) {
            setTimeout(active, 0);
        }
        fixBrowserByTimeout(node);
        // 30ms for firefox
    }, 30);
    return {
        stop: function stop() {
            if (node.rcEndListener) {
                node.rcEndListener();
            }
        },
    };
}
cssAnimate.isCssAnimationSupported = isCssAnimationSupported;

var util = {
    isAppearSupported: function (props) {
        return props.transitionName && props.transitionAppear || props.animation.appear;
    },
    isEnterSupported: function (props) {
        return props.transitionName && props.transitionEnter || props.animation.enter;
    },
    isLeaveSupported: function (props) {
        return props.transitionName && props.transitionLeave || props.animation.leave;
    },
    allowAppearCallback: function (props) {
        return props.transitionAppear || props.animation.appear;
    },
    allowEnterCallback: function (props) {
        return props.transitionEnter || props.animation.enter;
    },
    allowLeaveCallback: function (props) {
        return props.transitionLeave || props.animation.leave;
    },
    findDOMNode: function (component) {
        if (typeof preact.findDOMNode === "function") {
            return preact.findDOMNode(component);
        }
        else {
            return component.base || component;
        }
    },
};

var transitionMap = {
    enter: "transitionEnter",
    appear: "transitionAppear",
    leave: "transitionLeave",
};
var AnimateChild = /** @class */ (function (_super) {
    __extends(AnimateChild, _super);
    function AnimateChild() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AnimateChild.prototype.componentWillUnmount = function () {
        this.stop();
    };
    AnimateChild.prototype.componentWillEnter = function (done) {
        if (util.isEnterSupported(this.props)) {
            this.transition("enter", done);
        }
        else {
            done();
        }
    };
    AnimateChild.prototype.componentWillAppear = function (done) {
        if (util.isAppearSupported(this.props)) {
            this.transition("appear", done);
        }
        else {
            done();
        }
    };
    AnimateChild.prototype.componentWillLeave = function (done) {
        if (util.isLeaveSupported(this.props)) {
            this.transition("leave", done);
        }
        else {
            // always sync, do not interupt with react component life cycle
            // update hidden -> animate hidden ->
            // didUpdate -> animate leave -> unmount (if animate is none)
            done();
        }
    };
    AnimateChild.prototype.transition = function (animationType, finishCallback) {
        var _this = this;
        var node = util.findDOMNode(this);
        var props = this.props;
        var transitionName = props.transitionName;
        var nameIsObj = typeof transitionName === "object";
        this.stop();
        var end = function () {
            _this.stopper = null;
            finishCallback();
        };
        if ((isCssAnimationSupported || !props.animation[animationType]) &&
            transitionName && props[transitionMap[animationType]]) {
            var name = nameIsObj ? transitionName[animationType] : transitionName + "-" + animationType;
            var activeName = name + "-active";
            if (nameIsObj && transitionName[animationType + "Active"]) {
                activeName = transitionName[animationType + "Active"];
            }
            this.stopper = cssAnimate(node, {
                name: name,
                active: activeName,
            }, end);
        }
        else {
            this.stopper = props.animation[animationType](node, end);
        }
    };
    AnimateChild.prototype.stop = function () {
        var stopper = this.stopper;
        if (stopper) {
            this.stopper = null;
            stopper.stop();
        }
    };
    AnimateChild.prototype.render = function () {
        return this.props.children && this.props.children[0];
    };
    return AnimateChild;
}(Component));

// import PropTypes from "prop-types";
var defaultKey = "rc_animate_" + Date.now();
function getChildrenFromProps(props) {
    var children = props.children;
    var newChildren = [];
    children.forEach(function (child) {
        if (isValidElement(child)) {
            if (!child.key) {
                child = cloneElement(child, {
                    key: defaultKey,
                });
            }
            newChildren.push(child);
        }
    });
    return newChildren;
}
function noop() {
}
function addDisplyNone(child, clone) {
    var style = "display: none;";
    if (child.attributes.style) {
        if (typeof child.attributes.style === "string") {
            style = child.attributes.style.replace(/display *: *\w+ *;?/i, "");
            style += "display: none;";
        }
        else {
            style = __assign({}, child.attributes.style, { display: "none" });
        }
    }
    var childClone = null;
    if (clone) {
        childClone = __assign({}, clone, { style: style });
    }
    else {
        childClone = {
            style: style,
        };
    }
    return cloneElement(child, childClone);
}
function removeDisplyNone(child, clone) {
    if (child.attributes.style) {
        var style = void 0;
        if (typeof child.attributes.style === "string") {
            style = child.attributes.style.replace(/display *: *\w+ *;?/i, "");
        }
        else if (child.attributes.style.display) {
            style = __assign({}, child.attributes.style);
            delete style.display;
        }
        else {
            return child;
        }
        var childClone = null;
        if (clone) {
            childClone = __assign({}, clone, { style: style });
        }
        else {
            childClone = {
                style: style,
            };
        }
        return cloneElement(child, childClone);
    }
    else {
        return child;
    }
}
var Animate = /** @class */ (function (_super) {
    __extends(Animate, _super);
    function Animate(props, c) {
        var _this = _super.call(this, props, c) || this;
        _this.performEnter = function (key) {
            // may already remove by exclusive
            if (_this.childrenRefs[key]) {
                _this.currentlyAnimatingKeys[key] = true;
                _this.childrenRefs[key].componentWillEnter(_this.handleDoneAdding.bind(_this, key, "enter"));
            }
        };
        _this.performAppear = function (key) {
            if (_this.childrenRefs[key]) {
                _this.currentlyAnimatingKeys[key] = true;
                _this.childrenRefs[key].componentWillAppear(_this.handleDoneAdding.bind(_this, key, "appear"));
            }
        };
        _this.handleDoneAdding = function (key, type) {
            var props = _this.props;
            delete _this.currentlyAnimatingKeys[key];
            // if update on exclusive mode, skip check
            if (props.exclusive && props !== _this.nextProps) {
                return;
            }
            var currentChildren = getChildrenFromProps(props);
            if (!_this.isValidChildByKey(currentChildren, key)) {
                // exclusive will not need this
                _this.performLeave(key);
            }
            else {
                if (type === "appear") {
                    if (util.allowAppearCallback(props)) {
                        props.onAppear(key);
                        props.onEnd(key, true);
                    }
                }
                else {
                    if (util.allowEnterCallback(props)) {
                        props.onEnter(key);
                        props.onEnd(key, true);
                    }
                }
            }
        };
        _this.performLeave = function (key) {
            // may already remove by exclusive
            if (_this.childrenRefs[key]) {
                _this.currentlyAnimatingKeys[key] = true;
                _this.childrenRefs[key].componentWillLeave(_this.handleDoneLeaving.bind(_this, key));
            }
        };
        _this.handleDoneLeaving = function (key) {
            var props = _this.props;
            delete _this.currentlyAnimatingKeys[key];
            // if update on exclusive mode, skip check
            if (props.exclusive && props !== _this.nextProps) {
                return;
            }
            var currentChildren = getChildrenFromProps(props);
            // in case state change is too fast
            if (_this.isValidChildByKey(currentChildren, key)) {
                _this.performEnter(key);
            }
            else {
                var end = function () {
                    if (util.allowLeaveCallback(props)) {
                        props.onLeave(key);
                        props.onEnd(key, false);
                    }
                };
                if (!isSameChildren(_this.state.children, currentChildren, props.showProp)) {
                    var newChildren = null;
                    if (props.showProp) {
                        newChildren = currentChildren.map(function (child) {
                            if (child.key === key && (!props.disableShow && !child.attributes.disableShow)) {
                                return addDisplyNone(child);
                            }
                            return child;
                        });
                    }
                    // sync update
                    _this.state.children = newChildren || currentChildren;
                    _this.forceUpdate(end);
                }
                else {
                    end();
                }
            }
        };
        _this.currentlyAnimatingKeys = {};
        _this.keysToEnter = [];
        _this.keysToLeave = [];
        // const tmpChildren = getChildrenFromProps(this.props);
        var children = [];
        _this.props.children.forEach(function (child) {
            if (isValidElement(child)) {
                if (!child.key) {
                    child = cloneElement(child, {
                        key: defaultKey,
                    });
                }
                if (_this.props.showProp && (!_this.props.disableShow && !child.attributes.disableShow)) {
                    var showProp = child.attributes[_this.props.showProp];
                    if (showProp) {
                        child = removeDisplyNone(child);
                    }
                    else {
                        child = addDisplyNone(child);
                    }
                }
                children.push(child);
            }
        });
        _this.state = {
            children: children,
        };
        _this.childrenRefs = {};
        return _this;
    }
    Animate.prototype.componentDidMount = function () {
        var _this = this;
        var showProp = this.props.showProp;
        var children = this.state.children;
        if (showProp) {
            children = children.filter(function (child) {
                return !!child.attributes[showProp];
            });
        }
        children.forEach(function (child) {
            if (child) {
                _this.performAppear(child.key);
            }
        });
    };
    Animate.prototype.componentWillReceiveProps = function (nextProps, nextContext) {
        var _this = this;
        this.nextProps = nextProps;
        var nextChildren = getChildrenFromProps(nextProps);
        var props = this.props;
        // exclusive needs immediate response
        if (props.exclusive) {
            Object.keys(this.currentlyAnimatingKeys).forEach(function (key) {
                _this.stop(key);
            });
        }
        var showProp = props.showProp;
        var currentlyAnimatingKeys = this.currentlyAnimatingKeys;
        // last props children if exclusive
        var currentChildren = props.exclusive ?
            getChildrenFromProps(props) : this.state.children;
        // in case destroy in showProp mode
        var newChildren = [];
        if (showProp) {
            currentChildren.forEach(function (currentChild) {
                var nextChild = currentChild && findChildInChildrenByKey(nextChildren, currentChild.key);
                var newChild;
                var tmpChild = nextChild || currentChild;
                if ((!nextChild || !nextChild.attributes[showProp]) && currentChild.attributes[showProp]) {
                    newChild = cloneElement(tmpChild, (_a = {},
                        _a[showProp] = true,
                        _a));
                }
                else if (!nextProps.disableShow &&
                    !nextChild.attributes.disableShow &&
                    !nextChild.attributes[showProp] &&
                    !currentChild.attributes[showProp]) {
                    newChild = addDisplyNone(tmpChild, (_b = {},
                        _b[showProp] = false,
                        _b));
                }
                else {
                    newChild = nextChild;
                }
                if (newChild) {
                    newChildren.push(newChild);
                }
                var _a, _b;
            });
            nextChildren.forEach(function (nextChild) {
                if (!nextChild || !findChildInChildrenByKey(currentChildren, nextChild.key)) {
                    newChildren.push(nextChild);
                }
            });
        }
        else {
            newChildren = mergeChildren(currentChildren, nextChildren);
        }
        // need render to avoid update
        this.setState({
            children: newChildren,
        });
        nextChildren.forEach(function (child) {
            var key = child && child.key;
            if (child && currentlyAnimatingKeys[key]) {
                return;
            }
            var hasPrev = child && findChildInChildrenByKey(currentChildren, key);
            if (showProp) {
                var showInNext = child.attributes[showProp];
                if (hasPrev) {
                    var showInNow = findShownChildInChildrenByKey(currentChildren, key, showProp);
                    if (!showInNow && showInNext) {
                        _this.keysToEnter.push(key);
                    }
                }
                else if (showInNext) {
                    _this.keysToEnter.push(key);
                }
            }
            else if (!hasPrev) {
                _this.keysToEnter.push(key);
            }
        });
        currentChildren.forEach(function (child) {
            var key = child && child.key;
            if (child && currentlyAnimatingKeys[key]) {
                return;
            }
            var hasNext = child && findChildInChildrenByKey(nextChildren, key);
            if (showProp) {
                var showInNow = child.attributes[showProp];
                if (hasNext) {
                    var showInNext = findShownChildInChildrenByKey(nextChildren, key, showProp);
                    if (!showInNext && showInNow) {
                        _this.keysToLeave.push(key);
                    }
                }
                else if (showInNow) {
                    _this.keysToLeave.push(key);
                }
            }
            else if (!hasNext) {
                _this.keysToLeave.push(key);
            }
        });
    };
    Animate.prototype.componentDidUpdate = function () {
        var keysToEnter = this.keysToEnter;
        this.keysToEnter = [];
        keysToEnter.forEach(this.performEnter);
        var keysToLeave = this.keysToLeave;
        this.keysToLeave = [];
        keysToLeave.forEach(this.performLeave);
    };
    Animate.prototype.isValidChildByKey = function (currentChildren, key) {
        var showProp = this.props.showProp;
        if (showProp) {
            return findShownChildInChildrenByKey(currentChildren, key, showProp);
        }
        return findChildInChildrenByKey(currentChildren, key);
    };
    Animate.prototype.stop = function (key) {
        delete this.currentlyAnimatingKeys[key];
        var component = this.childrenRefs[key];
        if (component) {
            component.stop();
        }
    };
    Animate.prototype.render = function () {
        var _this = this;
        var props = this.props;
        this.nextProps = props;
        var stateChildren = this.state.children;
        var children = null;
        if (stateChildren) {
            children = stateChildren.map(function (child) {
                if (child === null || child === undefined) {
                    return child;
                }
                if (!child.key) {
                    throw new Error("must set key for <rc-animate> children");
                }
                var refFun = function (node) {
                    _this.childrenRefs[child.key] = node;
                };
                return h(AnimateChild, {
                    key: child.key,
                    ref: refFun,
                    animation: props.animation,
                    transitionEnter: props.transitionEnter,
                    transitionAppear: props.transitionAppear,
                    transitionName: props.transitionName,
                    transitionLeave: props.transitionLeave,
                }, child);
            });
        }
        var _Component = props.component;
        if (_Component) {
            var passedProps = props;
            if (typeof _Component === "string") {
                passedProps = __assign({ className: props.className, style: props.style }, props.componentProps);
            }
            return h(_Component, __assign({}, passedProps), children);
        }
        return children[0] || null;
    };
    Animate.defaultProps = {
        animation: {},
        component: "span",
        componentProps: {},
        transitionEnter: true,
        transitionLeave: true,
        transitionAppear: false,
        disableShow: false,
        onEnd: noop,
        onEnter: noop,
        onLeave: noop,
        onAppear: noop,
    };
    return Animate;
}(Component));

export default Animate;
//# sourceMappingURL=preact-animate-esm.js.map
