const re = /\s+/;
const toString = Object.prototype.toString;

const index = function _(arr, obj){
    if (arr.indexOf) {
        return arr.indexOf(obj);
    }
    for (let i = 0; i < arr.length; ++i) {
        if (arr[i] === obj) {
            return i;
        }
    }
    return -1;
};

export default class ClassList {
    public el: Element| HTMLElement;
    public list: any;
    constructor(node: Element| HTMLElement) {
        if (!node || !node.nodeType) {
            throw new Error("A DOM element reference is required");
        }
        this.el = node;
        this.list = node.classList;
    }
    public add(name: string) {
        // classList
        if (this.list) {
            this.list.add(name);
            return this;
        }
        // fallback
        const arr = this.array();
        const i = index(arr, name);
        if (i === -1) {
            arr.push(name);
        }
        this.el.className = arr.join(" ");
        return this;
    }
    public remove(name) {
        if ("[object RegExp]" === toString.call(name)) {
          return this.removeMatching(name);
        }
        // classList
        if (this.list) {
          this.list.remove(name);
          return this;
        }
        // fallback
        const arr = this.array();
        const i = index(arr, name);
        if (i !== -1) {
            arr.splice(i, 1);
        }
        this.el.className = arr.join(" ");
        return this;
    }
    public removeMatching(pre: RegExp) {
        const arr = this.array();
        for (const i of arr) {
            if (pre.test(i)) {
                this.remove(i);
            }
        }
        return this;
    }
    public array() {
        const className = this.el.getAttribute("class") || "";
        const str = className.replace(/^\s+|\s+$/g, "");
        const arr = str.split(re);
        if ("" === arr[0]) {
            arr.shift();
        }
        return arr;
      }
}
