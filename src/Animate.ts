import { h, Component, cloneElement, Children, findProps } from "react-import";
// import PropTypes from "prop-types";
import {
    mergeChildren,
    findShownChildInChildrenByKey,
    findChildInChildrenByKey,
    isSameChildren,
    isValidElement,
    isChildrenShow,
    forEach,
} from "./ChildrenUtils";
import AnimateChild from "./AnimateChild";
const defaultKey = `rc_animate_${Date.now()}`;
import animUtil from "./util";

enum AnimateType {
    enter = 1,
    leave = 2,
    appear = 3,
    disappear = 4,
}

const Injection = ["className", "style"];

function getChildrenFromProps(props: IAnimateProps) {
    const children = props.children;
    const newChildren = [];
    Children.forEach(children, (child) => {
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
    /**
     * 默认为'span', 用于Animate包裹多个子项必须
     */
    component: any;

    /**
     * 为上面的component设置props, 其中className, style可以来自Animate的className, style
     */
    componentProps: object;

    /**
     * 纯javascript动画
     */
    animation: object;

    /**
     * 设置各个状态的class
     */
    transitionName?: string | object;

    /**
     * 是否启用Enter
     */
    transitionEnter: boolean;

    /**
     * 是否启用Leave
     */
    transitionLeave: boolean;

    /**
     * 是否启用Appear
     */
    transitionAppear: boolean;

    /**
     * 是否启用Disappear
     */
    transitionDisappear: boolean;

    /**
     * 只允许有一个动画执行
     */
    exclusive: boolean;

    /**
     * 进入前生命周期
     */
    onBeforeEnter?: (child: AnimateChild) => any;

    /**
     * 进入时生命周期, 需要调用done才能结束动画
     */
    onEnter?: (child: AnimateChild, done: () => void) => void;

    /**
     * 进入后生命周期
     */
    onAfterEnter?: (child: AnimateChild) => any;

    /**
     * 离开前生命周期
     */
    onBeforeLeave?: (child: AnimateChild) => any;

    /**
     * 离开时生命周期, 需要调用done才能结束动画
     */
    onLeave?: (child: AnimateChild, done: () => void) => void;

    /**
     * 离开后生命周期, 调用该方法时dom已更新
     */
    onAfterLeave?: (child: AnimateChild) => any;

    /**
     * 出现前生命周期(同onBeforeEnter)
     */
    onBeforeAppear?: (child: AnimateChild) => void;

    /**
     * 出现时生命周期, 需要调用done才能结束动画
     */
    onAppear?: (child: AnimateChild, done: () => void) => void;

    /**
     * 出现后生命周期
     */
    onAfterAppear?: (child: AnimateChild) => void;

    /**
     * 消失前生命周期(同onBeforeLeave)
     */
    onBeforeDisappear?: (child: AnimateChild) => void;

    /**
     * 消失时生命周期, 需要调用done才能结束动画
     */
    onDisappear?: (child: AnimateChild, done: () => void) => void;

    /**
     * 消失后生命周期
     */
    onAfterDisappear?: (child: AnimateChild) => void;

    /**
     * 取消动画后生命周期
     */
    onAfterCancelled?: (child: AnimateChild, status: AnimateType) => any;

    /**
     * 使用变量切换状态的key
     */
    showProp: string;

    /**
     * 是否使用原生的display: none来切换
     */
    disableShow?: boolean;

    /**
     * component的默认class
     */
    className?: string;

    /**
     * component的默认style
     */
    style?: string | object;

    /**
     * 进行动画状态管理的child
     */
    children: any[];
    isRender?: boolean;
}
interface IAnimateState {
    children: any[];
    self: Animate;
}

import { filterProps } from "./component-animation";

export default class Animate extends Component<IAnimateProps, IAnimateState> {
    public static filterProps = filterProps;
    public static getDerivedStateFromProps(nextProps: IAnimateProps, previousState: IAnimateState): any {
        const self = previousState.self;
        self.nextProps = nextProps;
        const nextChildren = getChildrenFromProps(nextProps);
        const props = self.props;
        // exclusive needs immediate response
        if (props.exclusive) {
            forEach(Object.keys(self.currentlyAnimatingKeys), (key) => {
                self.stop(key);
            });
        }
        const showProp = props.showProp;
        const currentlyAnimatingKeys = self.currentlyAnimatingKeys;
        // last props children if exclusive
        const currentChildren = props.exclusive ?
            getChildrenFromProps(props) : self.state.children;
        // in case destroy in showProp mode
        let newChildren = [];
        if (showProp) {
            Children.forEach(currentChildren, (currentChild) => {
                const nextChild = currentChild && findChildInChildrenByKey(nextChildren, currentChild.key);
                let newChild;
                const tmpChild = nextChild || currentChild;
                if ((!nextChild || !findProps(nextChild)[showProp]) && findProps(currentChild)[showProp]) {
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
        // this.setState({
        //     children: newChildren,
        // });
        Children.forEach(nextChildren, (child) => {
            const key = child && child.key;
            if (child && currentlyAnimatingKeys[key]) {
                const status = currentlyAnimatingKeys[key];
                if (status === AnimateType.leave || status === AnimateType.disappear) {
                    if (isChildrenShow(child, currentChildren, showProp, key, true)) {
                        self.stop(key);
                        self.keysToEnter.push(key);
                    }
                }
                return;
            }
            if (isChildrenShow(child, currentChildren, showProp, key)) {
                self.keysToEnter.push(key);
            }

        });

        Children.forEach(currentChildren, (child) => {
            const key = child.key;
            if (child && currentlyAnimatingKeys[key]) {
                const status = currentlyAnimatingKeys[key];
                if (status === AnimateType.enter || status === AnimateType.appear) {
                    if (isChildrenShow(child, nextChildren, showProp, key)) {
                        self.stop(key);
                        self.keysToLeave.push(key);
                    }
                }
                return;
            }
            if (isChildrenShow(child, nextChildren, showProp, key)) {
                self.keysToLeave.push(key);
            }
        });
        return { children: newChildren };
    }

    public currentlyAnimatingKeys: {
        [key: string]: AnimateType;
    };
    public keysToEnter: string[];
    public keysToLeave: string[];
    public childrenRefs: {
        [key: string]: AnimateChild;
    };
    public nextProps;

    public static defaultProps = {
        exclusive: false,
        animation: {},
        component: "span",
        componentProps: {},
        transitionEnter: true,
        transitionLeave: true,
        transitionAppear: false,
        transitionDisappear: false,
        disableShow: false,
        isRender: false,
    };

    constructor(props: IAnimateProps, c) {
        super(props, c);

        this.currentlyAnimatingKeys = {};
        this.keysToEnter = [];
        this.keysToLeave = [];
        const children = getChildrenFromProps(props);
        this.state = {
            children,
            self: this,
        };

        this.childrenRefs = {};
    }

    public componentDidMount() {
        const showProp = this.props.showProp;
        const children = this.state.children;
        let appearChildren = [];
        const disappearChildren = [];
        if (showProp) {
            Children.forEach(children, (child) => {
                const props = findProps(child);
                if (!!props[showProp]) {
                    appearChildren.push(child);
                } else {
                    disappearChildren.push(child);
                }
            });
        } else {
            appearChildren = children;
        }
        Children.forEach(appearChildren, (child) => {
            if (child) {
                this.performAppear(child.key);
            }
        });
        Children.forEach(disappearChildren, (child) => {
            if (child) {
                this.performDisappear(child.key);
            }
        });
    }
    public componentWillReceiveProps(nextProps, nextContext) {
        const state = Animate.getDerivedStateFromProps(nextProps, this.state);
        this.setState(state);
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
        const activeChild = this.childrenRefs[key];
        if (activeChild) {
            this.currentlyAnimatingKeys[key] = AnimateType.enter;
            if (animUtil.allowEnterCallback(this.props) && this.props.onBeforeEnter) {
                this.props.onBeforeEnter(activeChild);
            }
            activeChild.componentWillEnter(() => {
                this.handleDoneAdding(key, AnimateType.enter);
            });
        }
    }

    public performLeave = (key) => {
        // may already remove by exclusive
        const activeChild = this.childrenRefs[key];
        if (activeChild) {
            this.currentlyAnimatingKeys[key] = AnimateType.leave;
            if (animUtil.allowLeaveCallback(this.props) && this.props.onBeforeLeave) {
                this.props.onBeforeLeave(activeChild);
            }
            activeChild.componentWillLeave(() => {
                this.handleDoneLeaving(key, AnimateType.leave);
            });
        }
    }

    public performAppear = (key) => {
        const activeChild = this.childrenRefs[key];
        if (activeChild) {
            this.currentlyAnimatingKeys[key] = AnimateType.appear;
            if (animUtil.allowAppearCallback(this.props) && this.props.onBeforeAppear) {
                this.props.onBeforeAppear(activeChild);
            }
            activeChild.componentWillAppear(() => {
                this.handleDoneAdding(key, AnimateType.appear);
            });
        }
    }

    public performDisappear = (key) => {
        const activeChild = this.childrenRefs[key];
        if (activeChild) {
            this.currentlyAnimatingKeys[key] = AnimateType.disappear;
            if (animUtil.allowDisappearCallback(this.props) && this.props.onBeforeDisappear) {
                this.props.onBeforeDisappear(activeChild);
            }
            activeChild.componentWillDisappear(() => {
                this.handleDoneLeaving(key, AnimateType.disappear);
            });
        }
    }

    private callLife(key: string, callBack, child?) {
        if (callBack) {
            const activeChild = this.childrenRefs[key];
            callBack(activeChild || child);
        }
    }

    public handleDoneAdding = (key: string, type: AnimateType) => {
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
            if (type === AnimateType.appear) {
                if (animUtil.allowAppearCallback(props)) {
                    this.callLife(key, props.onAfterAppear);
                    // props.onAppear(key);
                    // props.onEnd(key, true);
                }
            } else {
                if (animUtil.allowEnterCallback(props)) {
                    // props.onEnter(key);
                    this.callLife(key, props.onAfterEnter);
                    // props.onEnd(key, true);
                }
            }
        }
    }

    public handleDoneLeaving = (key: string, type: AnimateType) => {
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
            const activeChild = this.childrenRefs[key];
            const end = () => {
                if (type === AnimateType.leave) {
                    if (animUtil.allowLeaveCallback(props)) {
                        this.callLife(key, props.onAfterLeave, activeChild);
                        // props.onEnd(key, false);
                    }
                } else {
                    if (animUtil.allowDisappearCallback(props)) {
                        this.callLife(key, props.onAfterDisappear, activeChild);
                    }
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
        const animateStatus = this.currentlyAnimatingKeys[key];
        delete this.currentlyAnimatingKeys[key];
        const component = this.childrenRefs[key];
        if (component) {
            component.stop();
            if (this.props.onAfterCancelled) {
                this.props.onAfterCancelled(component, animateStatus);
            }
        }
    }

    public render() {
        const props = this.props;
        this.nextProps = props;
        const stateChildren = this.state.children;
        let children = null;
        children = Children.map(stateChildren, (child) => {
            if (child === null || child === undefined) {
                return child;
            }
            const _childProps = findProps(child);
            const childKey = (child && child.key) || (_childProps && _childProps.key);
            if (!childKey) {
                throw new TypeError("must set key for <Animate> children");
            }
            const refFun = (node) => {
                this.childrenRefs[childKey] = node;
            };
            const childProps = {
                key: childKey,
                rawKey: childKey,
                ref: refFun,
                animation: props.animation,
                transitionDisappear: props.transitionDisappear,
                transitionEnter: props.transitionEnter,
                transitionAppear: props.transitionAppear,
                transitionName: props.transitionName,
                transitionLeave: props.transitionLeave,
                onEnter: props.onEnter,
                onLeave: props.onLeave,
                onAppear: props.onAppear,
                onDisappear: props.onDisappear,
                isRender: props.isRender,
                displyShow: false,
            };
            if (animUtil.isDisplyShow(props, findProps(child))) {
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
                const injecObj = {};
                Injection.forEach((name: string) => {
                    if ((name in props)) {
                        injecObj[name] = props[name];
                    }
                });
                passedProps = {
                    ...injecObj,
                    ...props.componentProps,
                };
            }
            return h(_Component, {...passedProps}, children);
        }
        return children && children[0];
    }
}
