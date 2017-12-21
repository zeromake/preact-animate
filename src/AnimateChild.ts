import { Component } from "preact";
import cssAnimate, { isCssAnimationSupported } from "./css-animation";
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
    onEnter: (child: AnimateChild, callBack: () => void) => void;
    onLeave: (child: AnimateChild, callBack: () => void) => void;
}

export default class AnimateChild extends Component<IAnimateChildProps, any> {
    public stopper: null | { stop: () => void};
    public displayCss: string | undefined;
    public componentWillUnmount() {
        this.stop();
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
        if (animUtil.isEnterSupported(this.props)) {
            this.togglerDisply(true);
            this.transition("enter", done);
        } else {
            this.togglerDisply(true);
            done();
        }
    }

    public componentWillAppear(done: () => void) {
        if (animUtil.isAppearSupported(this.props)) {
            this.togglerDisply(true);
            this.transition("appear", done);
        } else {
            this.togglerDisply(true);
            done();
        }
    }
    public componentWillDisappear(done: () => void) {
        if (animUtil.isDisappearSupported(this.props)) {
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
        if (animUtil.isLeaveSupported(this.props)) {
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
        const node = animUtil.findDOMNode(this);
        const props = this.props;
        const transitionName = props.transitionName;
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
            }
            this.stopper = cssAnimate(
                node,
                { name, active: activeName },
                end,
                isAnimateEvent,
            );
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
        return this.props.children && this.props.children[0];
    }
}
