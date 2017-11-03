import { h, Component, cloneElement } from "preact";
// import PropTypes from "prop-types";
import {
    mergeChildren,
    findShownChildInChildrenByKey,
    findChildInChildrenByKey,
    isSameChildren,
    isValidElement,
} from "./ChildrenUtils";
import AnimateChild from "./AnimateChild";
const defaultKey = `rc_animate_${Date.now()}`;
import animUtil from "./util";

function getChildrenFromProps(props: IAnimateProps) {
    const children = props.children;
    const newChildren = [];
    children.forEach((child) => {
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

function addDisplyNone(child: any, clone?: any) {
    let style = "display: none;";
    if (child.attributes.style) {
        if (typeof child.attributes.style === "string") {
            style = child.attributes.style.replace(/display *: *\w+ *;?/i, "");
            style += "display: none;";
        } else {
            style = {
                ...child.attributes.style,
                display: 'none'
            };
        }
    }
    let childClone = null;
    if (clone) {
        childClone = {
            ...clone,
            style,
        };
    } else {
        childClone = {
            style,
        }
    }
     
    return cloneElement(
        child,
        childClone,
    );
}

function removeDisplyNone(child: any, clone?: any) {
    if (child.attributes.style) {
        let style;
        if (typeof child.attributes.style === "string") {
            style = child.attributes.style.replace(/display *: *\w+ *;?/i, "");
        } else if(child.attributes.style.display) {
            style = {
                ...child.attributes.style
            }
            delete style.display;
        } else {
            return child;
        }
        let childClone = null;
        if (clone) {
            childClone = {
                ...clone,
                style,
            };
        } else {
            childClone = {
                style,
            }
        }
        return cloneElement(
            child,
            childClone,
        );
    } else {
        return child;
    }
}

interface IAnimateProps {
    component: any;
    componentProps: object;
    animation: object;
    transitionName: string|object;
    transitionEnter: boolean;
    transitionAppear: boolean;
    transitionLeave: boolean;
    exclusive: boolean;
    onEnd: (key: string, exists: boolean) => void;
    onEnter: (key: string) => void;
    onLeave: (key: string) => void;
    onAppear: (key: string) => void;
    showProp: string;
    disableShow?: boolean;
    className?: string;
    style?: string|object;
    children: any[];
}
interface IAnimateState {
    children: any[];
}

export default class Animate extends Component<IAnimateProps, IAnimateState> {
    public currentlyAnimatingKeys: {
        [key: string]: boolean;
    };
    public keysToEnter: string[];
    public keysToLeave: string[];
    public childrenRefs: {
        [key: string]: AnimateChild;
    };
    public nextProps;

    public static defaultProps = {
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

    constructor(props: IAnimateProps, c) {
        super(props, c);

        this.currentlyAnimatingKeys = {};
        this.keysToEnter = [];
        this.keysToLeave = [];
        // const tmpChildren = getChildrenFromProps(this.props);
        const children = []
        this.props.children.forEach((child) => {
            if (isValidElement(child)) {
                if (!child.key) {
                    child = cloneElement(child, {
                        key: defaultKey,
                    });
                }
                if (this.props.showProp && (!this.props.disableShow && !child.attributes.disableShow)) {
                    const showProp = child.attributes[this.props.showProp];
                    if (showProp) {
                        child = removeDisplyNone(child)
                    } else {
                        child = addDisplyNone(child);
                    }
                }
                children.push(child);
            }
        })
        this.state = {
            children,
        };

        this.childrenRefs = {};
    }

    public componentDidMount() {
        const showProp = this.props.showProp;
        let children = this.state.children;
        if (showProp) {
            children = children.filter((child) => {
                return !!child.attributes[showProp];
            });
        }
        children.forEach((child) => {
            if (child) {
                this.performAppear(child.key);
            }
        });
    }

    public componentWillReceiveProps(nextProps, nextContext) {
        this.nextProps = nextProps;
        const nextChildren = getChildrenFromProps(nextProps);
        const props = this.props;
        // exclusive needs immediate response
        if (props.exclusive) {
            Object.keys(this.currentlyAnimatingKeys).forEach((key) => {
                this.stop(key);
            });
        }
        const showProp = props.showProp;
        const currentlyAnimatingKeys = this.currentlyAnimatingKeys;
        // last props children if exclusive
        const currentChildren = props.exclusive ?
            getChildrenFromProps(props) : this.state.children;
        // in case destroy in showProp mode
        let newChildren = [];
        if (showProp) {
            currentChildren.forEach((currentChild) => {
                const nextChild = currentChild && findChildInChildrenByKey(nextChildren, currentChild.key);
                let newChild;
                if ((!nextChild || !nextChild.attributes[showProp]) && currentChild.attributes[showProp]) {
                    const tmpChild = nextChild || currentChild;
                    if (!props.disableShow && !tmpChild.attributes.disableShow) {
                        newChild = cloneElement(tmpChild, {
                            [showProp]: true,
                        });
                    } else {
                        newChild = removeDisplyNone(tmpChild, {
                            [showProp]: true,
                        });
                    }
                } else {
                    newChild = addDisplyNone(nextChild);
                }
                if (newChild) {
                    newChildren.push(newChild);
                }
            });
            nextChildren.forEach((nextChild) => {
                if (!nextChild || !findChildInChildrenByKey(currentChildren, nextChild.key)) {
                    newChildren.push(nextChild);
                }
            });
        } else {
            newChildren = mergeChildren(
                currentChildren,
                nextChildren,
            );
        }

        // need render to avoid update
        this.setState({
            children: newChildren,
        });

        nextChildren.forEach((child) => {
            const key = child && child.key;
            if (child && currentlyAnimatingKeys[key]) {
                return;
            }
            const hasPrev = child && findChildInChildrenByKey(currentChildren, key);
            if (showProp) {
                const showInNext = child.attributes[showProp];
                if (hasPrev) {
                    const showInNow = findShownChildInChildrenByKey(currentChildren, key, showProp);
                    if (!showInNow && showInNext) {
                        this.keysToEnter.push(key);
                    }
                } else if (showInNext) {
                    this.keysToEnter.push(key);
                }
            } else if (!hasPrev) {
                this.keysToEnter.push(key);
            }
        });

        currentChildren.forEach((child) => {
            const key = child && child.key;
            if (child && currentlyAnimatingKeys[key]) {
                return;
            }
            const hasNext = child && findChildInChildrenByKey(nextChildren, key);
            if (showProp) {
                const showInNow = child.attributes[showProp];
                if (hasNext) {
                    const showInNext = findShownChildInChildrenByKey(nextChildren, key, showProp);
                    if (!showInNext && showInNow) {
                        this.keysToLeave.push(key);
                    }
                } else if (showInNow) {
                    this.keysToLeave.push(key);
                }
            } else if (!hasNext) {
                this.keysToLeave.push(key);
            }
        });

    }

    public componentDidUpdate() {
        const keysToEnter = this.keysToEnter;
        this.keysToEnter = [];
        keysToEnter.forEach(this.performEnter);
        const keysToLeave = this.keysToLeave;
        this.keysToLeave = [];
        keysToLeave.forEach(this.performLeave);
    }

    public performEnter = (key) => {
        // may already remove by exclusive
        if (this.childrenRefs[key]) {
            this.currentlyAnimatingKeys[key] = true;
            this.childrenRefs[key].componentWillEnter(
                this.handleDoneAdding.bind(this, key, "enter"),
            );
        }
    }

    public performAppear = (key) => {
        if (this.childrenRefs[key]) {
            this.currentlyAnimatingKeys[key] = true;
            this.childrenRefs[key].componentWillAppear(
                this.handleDoneAdding.bind(this, key, "appear"),
            );
        }
    }

    public handleDoneAdding = (key, type) => {
        const props = this.props;
        delete this.currentlyAnimatingKeys[key];
        // if update on exclusive mode, skip check
        if (props.exclusive && props !== this.nextProps) {
            return;
        }
        const currentChildren = getChildrenFromProps(props);
        if (!this.isValidChildByKey(currentChildren, key)) {
            // exclusive will not need this
            this.performLeave(key);
        } else {
            if (type === "appear") {
                if (animUtil.allowAppearCallback(props)) {
                    props.onAppear(key);
                    props.onEnd(key, true);
                }
            } else {
                if (animUtil.allowEnterCallback(props)) {
                    props.onEnter(key);
                    props.onEnd(key, true);
                }
            }
        }
    }

    public performLeave = (key) => {
        // may already remove by exclusive
        if (this.childrenRefs[key]) {
            this.currentlyAnimatingKeys[key] = true;
            this.childrenRefs[key].componentWillLeave(this.handleDoneLeaving.bind(this, key));
        }
    }

    public handleDoneLeaving = (key: string) => {
        const props = this.props;
        delete this.currentlyAnimatingKeys[key];
        // if update on exclusive mode, skip check
        if (props.exclusive && props !== this.nextProps) {
            return;
        }
        const currentChildren = getChildrenFromProps(props);
        // in case state change is too fast
        if (this.isValidChildByKey(currentChildren, key)) {
            this.performEnter(key);
        } else {
            const end = () => {
                if (animUtil.allowLeaveCallback(props)) {
                    props.onLeave(key);
                    props.onEnd(key, false);
                }
            };
            if (!isSameChildren(this.state.children,
                currentChildren, props.showProp)) {
                let newChildren = null;
                if (props.showProp) {
                    newChildren = currentChildren.map((child) => {
                        if (child.key === key && (!props.disableShow && !child.attributes.disableShow)) {
                            return addDisplyNone(child);
                        }
                        return child
                    });
                }
                // sync update
                this.state.children = newChildren || currentChildren;
                this.forceUpdate(end);
            } else {
                end();
            }
        }
    }

    public isValidChildByKey(currentChildren, key) {
        const showProp = this.props.showProp;
        if (showProp) {
            return findShownChildInChildrenByKey(currentChildren, key, showProp);
        }
        return findChildInChildrenByKey(currentChildren, key);
    }

    public stop(key: string) {
        delete this.currentlyAnimatingKeys[key];
        const component = this.childrenRefs[key];
        if (component) {
            component.stop();
        }
    }

    public render() {
        const props = this.props;
        this.nextProps = props;
        const stateChildren = this.state.children;
        let children = null;
        if (stateChildren) {
            children = stateChildren.map((child) => {
            if (child === null || child === undefined) {
                return child;
            }
            if (!child.key) {
                throw new Error("must set key for <rc-animate> children");
            }
            const refFun = (node) => {
                this.childrenRefs[child.key] = node;
            };
            return h(
                (AnimateChild as any),
                {
                    key: child.key,
                    ref: refFun,
                    animation: props.animation,
                    transitionEnter: props.transitionEnter,
                    transitionAppear: props.transitionAppear,
                    transitionName: props.transitionName,
                    transitionLeave: props.transitionLeave,
                },
                child);
            });
        }
        const _Component = props.component;
        if (_Component) {
            let passedProps: any = props;
            if (typeof _Component === "string") {
                passedProps = {
                    className: props.className,
                    style: props.style,
                    ...props.componentProps,
                };
            }
            return h(_Component, {...passedProps}, children);
        }
        return children[0] || null;
    }
}
