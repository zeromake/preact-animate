
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

declare module "react-import" {
    import { h, Component, cloneElement } from "preact";
    interface IChildren {
        map: (children: any[], callback: any, ctx?: any) => any[];
        forEach: (children: any[], callback: any, ctx?: any) => any;
        only: (children: any[]) => any;
    }
    const Children: IChildren;
    function findProps(vnode: any);
    function findDOMNode(component: Component<any, any>): HTMLElement;
    export {
        h,
        Component,
        cloneElement,
        Children,
        findProps,
        findDOMNode,
    };
}
