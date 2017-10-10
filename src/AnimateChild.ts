import { Component } from "preact";
import cssAnimate, { isCssAnimationSupported } from "./css-animation";
import animUtil from "./util";

const transitionMap = {
    enter: "transitionEnter",
    appear: "transitionAppear",
    leave: "transitionLeave",
};

interface IAnimateChildProps {
    key: string;
    animation: object;
    transitionName: string|object;
    transitionEnter: boolean;
    transitionAppear: boolean;
    transitionLeave: boolean;
}

export default class AnimateChild extends Component<IAnimateChildProps, any> {
    public stopper: null | { stop: () => void};
    public componentWillUnmount() {
        this.stop();
    }

    public componentWillEnter(done: () => void) {
        if (animUtil.isEnterSupported(this.props)) {
            this.transition("enter", done);
        } else {
            done();
        }
    }

    public componentWillAppear(done: () => void) {
        if (animUtil.isAppearSupported(this.props)) {
            this.transition("appear", done);
        } else {
            done();
        }
    }

    public componentWillLeave(done: () => void) {
        if (animUtil.isLeaveSupported(this.props)) {
            this.transition("leave", done);
        } else {
            // always sync, do not interupt with react component life cycle
            // update hidden -> animate hidden ->
            // didUpdate -> animate leave -> unmount (if animate is none)
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
            this.stopper = null;
            finishCallback();
        };
        if ((isCssAnimationSupported || !props.animation[animationType]) &&
                transitionName && props[transitionMap[animationType]]) {
            const name = nameIsObj ? (transitionName as object)[animationType] : `${transitionName}-${animationType}`;
            let activeName = `${name}-active`;
            if (nameIsObj && (transitionName as object)[`${animationType}Active`]) {
                activeName = (transitionName as object)[`${animationType}Active`];
            }
            this.stopper = cssAnimate(node, {
                name,
                active: activeName,
            }, end);
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
        return this.props.children[0];
    }
}
