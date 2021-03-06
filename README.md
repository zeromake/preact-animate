# preact-animate
---

animate preact or react element easily

## Feature

* support ie8,ie8+,chrome,firefox,safari

## install

`npm i preact-animate`

## Usage

### preact
```jsx
import Animate from 'preact-animate';

preact.render(
  <Animate animation={{ ... }}>
    <p key="1">1</p>
    <p key="2">2</p>
  </Animate>
, mountNode);
```

### react
set webpack alias

``` javascript
module.exports = {
  resolve: {
    alias: {
      "preact-animate": "preact-animate/dist/react-animate.js"
    }
  }
}
```

or rollup alias
``` javascript
const alias = require('rollup-plugin-alias')
module.exports = {
  plugins: [new alias({
    'preact-animate': 'preact-animate/dist/react-animate.js'
  })]
}
```

## API

### props

<table class="table table-bordered table-striped">
    <thead>
    <tr>
        <th style="width: 100px;">name</th>
        <th>type</th>
        <th style="width: 50px;">default</th>
        <th>description</th>
    </tr>
    </thead>
    <tbody>
        <tr>
          <td>component</td>
          <td>React.Element/String</td>
          <td>'span'</td>
          <td>wrap dom node or component for children. set to '' if you do not wrap for only one child</td>
        </tr>
        <tr>
          <td>componentProps</td>
          <td>Object</td>
          <td>{}</td>
          <td>extra props that will be passed to component</td>
        </tr>
        <tr>
          <td>showProp</td>
          <td>String</td>
          <td></td>
          <td>using prop for show and hide. [demo](http://react-component.github.io/animate/examples/hide-todo.html) </td>
        </tr>
        <tr>
          <td>exclusive</td>
          <td>Boolean</td>
          <td></td>
          <td>whether allow only one set of animations(enter and leave) at the same time. </td>
        </tr>
        <tr>
          <td>transitionName</td>
          <td>String|Object</td>
          <td></td>
          <td>specify corresponding css, see ReactCSSTransitionGroup</td>
        </tr>
       <tr>
         <td>transitionAppear</td>
         <td>Boolean</td>
         <td>false</td>
         <td>whether support transition appear anim</td>
       </tr>
        <tr>
          <td>transitionEnter</td>
          <td>Boolean</td>
          <td>true</td>
          <td>whether support transition enter anim</td>
        </tr>
       <tr>
         <td>transitionLeave</td>
         <td>Boolean</td>
         <td>true</td>
         <td>whether support transition leave anim</td>
       </tr>
       <tr>
         <td>onBeforeEnter</td>
         <td>function(child: AnimateChild) => void;</td>
         <td>null</td>
         <td>animation before Enter life</td>
       </tr>
       <tr>
         <td>onEnter</td>
         <td>function(child: AnimateChild, done: () => void) => void;</td>
         <td>null</td>
         <td>animation Enter life must called `done`</td>
       </tr>
       <tr>
         <td>onAfterEnter</td>
         <td>function(child: AnimateChild) => void;</td>
         <td>null</td>
         <td>animation after Enter life</td>
       </tr>
       <tr>
         <td>onBeforeLeave</td>
         <td>function(child: AnimateChild) => void;</td>
         <td>null</td>
         <td>animation before Leave life</td>
       </tr>
       <tr>
         <td>onLeave</td>
         <td>function(child: AnimateChild, done: () => void) => void;</td>
         <td>null</td>
         <td>animation Leave life must called `done`</td>
       </tr>
       <tr>
         <td>onAfterLeave</td>
         <td>function(child: AnimateChild) => void;</td>
         <td>null</td>
         <td>animation after Leave life</td>
       </tr>
       <tr>
         <td>onBeforeAppear</td>
         <td>function(child: AnimateChild) => void;</td>
         <td>null</td>
         <td>animation before appear life</td>
       </tr>
       <tr>
         <td>onAppear</td>
         <td>function(child: AnimateChild, done: () => void) => void;</td>
         <td>null</td>
         <td>animation Appear life must called `done`</td>
       </tr>
       <tr>
         <td>onAfterAppear</td>
         <td>function(child: AnimateChild) => void;</td>
         <td>null</td>
         <td>animation after Appear life</td>
       </tr>
       <tr>
         <td>onBeforeDisappear</td>
         <td>function(child: AnimateChild) => void;</td>
         <td>null</td>
         <td>animation before Disappear life</td>
       </tr>
       <tr>
         <td>onDisappear</td>
         <td>function(child: AnimateChild, done: () => void) => void;</td>
         <td>null</td>
         <td>animation Disappear life must called `done`</td>
       </tr>
       <tr>
         <td>onAfterDisappear</td>
         <td>function(child: AnimateChild) => void;</td>
         <td>null</td>
         <td>animation after Disappear life</td>
       </tr>
       <tr>
         <td>onAfterCancelled</td>
         <td>function(child: AnimateChild, status: number) => any</td>
         <td>null</td>
         <td>animation after cancelled life</td>
       </tr>
       <tr>
         <td>animation</td>
         <td>Object</td>
         <td>{}</td>
         <td>
            to animate with js. see animation format below.
         </td>
       </tr>
    </tbody>
</table>

### animation format

with appear, enter and leave as keys. for example:

```js
  {
    appear: function(node, done){
      node.style.display='none';
      $(node).slideUp(done);
      return {
        stop:function(){
          // jq will call done on finish
          $(node).stop(true);
        }
      };
    },
    enter: function(){
      this.appear.apply(this,arguments);
    },
    leave: function(node, done){
      node.style.display='';
      $(node).slideDown(done);
      return {
        stop:function(){
          // jq will call done on finish
          $(node).stop(true);
        }
      };
    }
  }
```

## License

preact-animate is released under the MIT license.

## Thank

fork by [rc-animate](https://github.com/react-component/animate)
