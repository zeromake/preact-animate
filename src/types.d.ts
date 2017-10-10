
type voidFun = () => void;

interface IEndCall {
    end: voidFun;
    start: voidFun;
    active: voidFun;
}
interface ITransition {
    active: string;
    name: string;
}
declare module "css-animation" {
    const cssAnimate: (node: Node | Element | HTMLElement, transitionName: string | ITransition, endCallback: voidFun | IEndCall) => { stop: voidFun };
    export const isCssAnimationSupported: boolean;
    export default cssAnimate;
}
