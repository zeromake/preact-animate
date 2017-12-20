import { h, Component, cloneElement } from "preact";
// import PropTypes from "prop-types";
import {
    mergeChildren,
    findShownChildInChildrenByKey,
    findChildInChildrenByKey,
    isSameChildren,
    isValidElement,
    forEach,
    arrayMap,
} from "./ChildrenUtils";
import AnimateChild from "./AnimateChild";
const defaultKey = `rc_animate_${Date.now()}`;
import animUtil from "./util";

function getChildrenFromProps(props: IAnimateProps) {
    const children = props.children;
    const newChildren = [];
    forEach(children, (child) => {
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

interface IAnimateProps {
    component: any;
    componentProps: object;
    animation: object;
    transitionName: string|object;
    transitionEnter: boolean;
    transitionAppear: boolean;
    transitionLeave: boolean;
    transitionDisappear: boolean;
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
        const children = [];
        forEach(this.props.children, (child) => {
            if (isValidElement(child)) {
                if (!child.key) {
                    child = cloneElement(child, {
                        key: defaultKey,
                    });
                }
                children.push(child);
            }
        });
        this.state = {
            children,
        };

        this.childrenRefs = {};
    }

    public componentDidMount() {
        const showProp = this.props.showProp;
        const children = this.state.children;
        let appearChildren = [];
        const disappearChildren = [];
        if (showProp) {
            forEach(children, (child) => {
                if (!!child.attributes[showProp]) {
                    appearChildren.push(child);
                } else {
                    disappearChildren.push(child);
                }
            });
        } else {
            appearChildren = children;
        }
        forEach(appearChildren, (child) => {
            if (child) {
                this.performAppear(child.key);
            }
        });
        forEach(disappearChildren, (child) => {
            if (child) {
                this.performDisappear(child.key);
            }
        });
    }

    public componentWillReceiveProps(nextProps, nextContext) {
        this.nextProps = nextProps;
        const nextChildren = getChildrenFromProps(nextProps);
        const props = this.props;
        // exclusive needs immediate response
        if (props.exclusive) {
            forEach(Object.keys(this.currentlyAnimatingKeys), (key) => {
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
            forEach(currentChildren, (currentChild) => {
                const nextChild = currentChild && findChildInChildrenByKey(nextChildren, currentChild.key);
                let newChild;
                const tmpChild = nextChild || currentChild;
                if ((!nextChild || !nextChild.attributes[showProp]) && currentChild.attributes[showProp]) {
                    newChild = cloneElement(tmpChild, {
                        [showProp]: true,
                    });
                } else {
                    newChild = nextChild;
                }
                if (newChild) {
                    newChildren.push(newChild);
                }
            });
            forEach(nextChildren, (nextChild) => {
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

        forEach(nextChildren, (child) => {
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

        forEach(currentChildren, (child) => {
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
        forEach(keysToEnter, this.performEnter);
        const keysToLeave = this.keysToLeave;
        this.keysToLeave = [];
        forEach(keysToLeave, this.performLeave);
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
    public performDisappear = (key) => {
        if (this.childrenRefs[key]) {
            this.currentlyAnimatingKeys[key] = true;
            this.childrenRefs[key].componentWillDisappear(this.handleDoneLeaving.bind(this, key));
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
            if (
                !isSameChildren(
                    this.state.children,
                    currentChildren,
                    props.showProp,
                )
            ) {
                this.state.children = currentChildren;
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
        children = arrayMap(stateChildren, (child) => {
            if (child === null || child === undefined) {
                return child;
            }
            if (!child.key) {
                throw new Error("must set key for <rc-animate> children");
            }
            const refFun = (node) => {
                this.childrenRefs[child.key] = node;
            };
            const childProps = {
                key: child.key,
                ref: refFun,
                animation: props.animation,
                transitionDisappear: props.transitionDisappear,
                transitionEnter: props.transitionEnter,
                transitionAppear: props.transitionAppear,
                transitionName: props.transitionName,
                transitionLeave: props.transitionLeave,
                displyShow: false,
            };
            if (animUtil.isDisplyShow(props, child.attributes)) {
                childProps.displyShow = true;
            }
            return h(
                (AnimateChild as any),
                childProps,
                child,
            );
        });
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
        return children && children[0];
    }
}
