import { Component, findProps, findDOMNode, Children } from "react-import";
import { componentAnimate, isCssAnimationSupported } from "./component-animation";
import cssAnimate from "./css-animation";
import animUtil from "./util";
import { forEach } from "./ChildrenUtils";

const transitionMap = {
    enter: "transitionEnter",
    appear: "transitionAppear",
    leave: "transitionLeave",
    disappear: "transitionDisappear",
};

interface IAnimateChildProps {
    key: string;
    animation: object;
    transitionName: string|object;
    transitionEnter: boolean;
    transitionAppear: boolean;
    transitionLeave: boolean;
    transitionDisappear: boolean;
    displyShow: boolean;
    children?: any[];
    isRender: boolean;
    onEnter: (child: AnimateChild, done: () => void) => void;
    onLeave: (child: AnimateChild, done: () => void) => void;
    onAppear: (child: AnimateChild, done: () => void) => void;
    onDisappear: (child: AnimateChild, done: () => void) => void;
}

export default class AnimateChild extends Component<IAnimateChildProps, any> {
    public static getDerivedStateFromProps(nextProps: IAnimateChildProps, previousState: any): any {
        const child = Children.only(nextProps.children);
        const childProps = findProps(child);
        const self: AnimateChild = previousState.self;
        self.transitionName = childProps && childProps.transitionName;
        self.isRender = !!(childProps && childProps.isRender);
        return {
            child,
        };
    }

    public stopper: null | { stop: () => void};
    public displayCss: string | undefined;
    public transitionName: string|object|null = null;
    public rcEndListener?: (e?: Event) => void;
    public rcAnimTimeout?: number;
    public isRender: boolean;

    constructor(props, content) {
        super(props, content);
        const child = Children.only(props.children);
        const childProps = findProps(child);
        this.transitionName = childProps && childProps.transitionName;
        this.isRender = childProps && childProps.isRender;
        // console.log("AnimateChild");
        this.state = {
            child,
            self: this,
        };
    }

    public componentWillReceiveProps(nextProps) {
        const state = AnimateChild.getDerivedStateFromProps(nextProps, this.state);
        if (state) {
            this.setState(state);
        }
    }

    public componentWillUnmount() {
        this.stop();
        animUtil.removeDisplyNone(this);
    }
    private togglerDisply(show: boolean) {
        if (this.props.displyShow) {
            if (show) {
                animUtil.removeDisplyNone(this);
            } else {
                animUtil.addDisplyNone(this);
            }
        }
    }
    public componentWillEnter(done: () => void) {
        if (animUtil.isEnterSupported(this.props, this.transitionName)) {
            this.togglerDisply(true);
            this.transition("enter", done);
        } else {
            this.togglerDisply(true);
            done();
        }
    }

    public componentWillAppear(done: () => void) {
        if (animUtil.isAppearSupported(this.props, this.transitionName)) {
            this.togglerDisply(true);
            this.transition("appear", done);
        } else {
            this.togglerDisply(true);
            done();
        }
    }
    public componentWillDisappear(done: () => void) {
        if (animUtil.isDisappearSupported(this.props, this.transitionName)) {
            this.transition("disappear", () => {
                this.togglerDisply(false);
                done();
            });
        } else {
            this.togglerDisply(false);
            done();
        }
    }
    public componentWillLeave(done: () => void) {
        if (animUtil.isLeaveSupported(this.props, this.transitionName)) {
            this.transition("leave", () => {
                this.togglerDisply(false);
                done();
            });
        } else {
            // always sync, do not interupt with react component life cycle
            // update hidden -> animate hidden ->
            // didUpdate -> animate leave -> unmount (if animate is none)
            this.togglerDisply(false);
            done();
        }
    }

    private transition(animationType: string, finishCallback: () => void) {
        const node: HTMLElement = findDOMNode(this);
        if (node.nodeType === 3) {
            finishCallback();
            return;
        }
        const props = this.props;
        const transitionName = this.transitionName || props.transitionName;
        const nameIsObj = typeof transitionName === "object";
        this.stop();
        const end = () => {
            if (this.stopper) {
                this.stopper = null;
                finishCallback();
            }
        };
        if ((isCssAnimationSupported || !props.animation[animationType]) &&
                transitionName && props[transitionMap[animationType]]) {
            const name = nameIsObj ? (transitionName as object)[animationType] : `${transitionName}-${animationType}`;
            let activeName = `${name}-active`;
            if (nameIsObj && (transitionName as object)[`${animationType}Active`]) {
                activeName = (transitionName as object)[`${animationType}Active`];
            }
            let isAnimateEvent = true;
            let propsEvent: ((child: AnimateChild, callBack: () => void) => void) | null = null;
            if (props.onEnter && animationType === "enter") {
                isAnimateEvent = false;
                propsEvent = props.onEnter;
            } else if (props.onLeave && animationType === "leave") {
                isAnimateEvent = false;
                propsEvent = props.onLeave;
            } else if (props.onAppear && animationType === "appear" ) {
                isAnimateEvent = false;
                propsEvent = props.onAppear;
            } else if (props.onDisappear && animationType === "disappear" ) {
                isAnimateEvent = false;
                propsEvent = props.onDisappear;
            }
            if (props.isRender || this.isRender) {
                this.stopper = componentAnimate(
                    this,
                    { name, active: activeName },
                    end,
                    isAnimateEvent,
                );
            } else {
                this.stopper = cssAnimate(
                    node,
                    { name, active: activeName },
                    end,
                    isAnimateEvent,
                );
            }
            if (!isAnimateEvent && propsEvent) {
                propsEvent(this, this.stop.bind(this));
            }
        } else {
            this.stopper = props.animation[animationType](node, end);
        }
    }

    public stop() {
        const stopper = this.stopper;
        if (stopper) {
            this.stopper = null;
            stopper.stop();
        }
    }

    public render() {
        return this.state.child;
    }
}
