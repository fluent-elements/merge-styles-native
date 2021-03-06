This is a fork of the `merge-styles` package from Office UI Fabric for React Native.

It provides a comptible API and enables code sharing between Office UI Fabric and React Native.

Also it enables React Native components to be styled with style sets.

# API

In addition to the official merge-styles API (see below) the following API is provided:

## class Stylesheet

**public getStyle(...classNames: string[])**

Returns an arrray of React Native styles that can be passed to component's style property.

Each element of `classNames` can containt multiple class names separated by a space character similiar to HTML and CSS.

i.e. `classNames("a", "b")` is the same as `classNames("a b")`

# Breaking changes

Registering fonts, keyframes, RTL support and server side rendering were removed as they do not apply to React Native.

Selectors and media queries are ignored.

# Example usage with React Native

```
import { mergeStyles, Stylesheet } from 'merge-styles-native';

const stylesheet = Stylesheet.getInstance();

const containerStyle = mergeStyles({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#F5FCFF'
});

const textStyle = mergeStyles({
  textAlign: 'center'
});

const welcomeStyle = mergeStyles(
  textStyle,
  {
    fontSize: 20,
    margin: 10
  }
);

const instructionsStyle = mergeStyles(
  textStyle,
  {
    marginBottom: 5
  }
);

const redStyle = mergeStyles({
  color: '#aa3333'
});

const blueStyle = mergeStyles({
  color: '#3333aa'
});

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

interface Props {}

export default class App extends Component<Props> {
  render() {
    return (
      <View style={stylesheet.getStyle(containerStyle)}>
        <Text style={stylesheet.getStyle(welcomeStyle)}>Welcome to React Native!</Text>
        <Text style={stylesheet.getStyle(instructionsStyle, blueStyle)}>To get started, edit App.tsx.</Text>
        <Text style={stylesheet.getStyle(instructionsStyle + ' ' + redStyle)}>{instructions}</Text>
      </View>
    );
  }
}
```

See: [merge-styles-example-native](https://github.com/fluent-elements/merge-styles-example-native)

# Important

The style type definitions are from merge-styles for HTML and CSS so you can only use style properties that are common between HTML and React Native. This might change in the future.

React Native style properties are filtered before they are registered with React Native's Stylesheet.


# [merge-styles](http://dev.office.com/fabric)

The `merge-styles` library provides utilities for loading styles through javascript. It is designed to make it simple to style components through javascript. It generates css classes, rather than using inline styling, to ensure we can use css features like pseudo selectors (:hover) and parent/child selectors (media queries).

The library was built for speed and size; the entire package is 2.62k gzipped. It has no dependencies other than `tslib`.

Simple usage:

```
import { mergeStyles, mergeStyleSet } from '@uifabric/merge-styles';

// Produces 'css-0' class name which can be used anywhere
mergeStyles({ background: 'red' });

// Produces a class map for a bunch of rules all at once
mergeStyleSet({
  root: { background: 'red' },
  child: { background: 'green' }
});

// Returns { root: 'root-0', child: 'child-1' }
```

Both utilities behave similar to a deep Object.assign; you can collapse many objects down into one class name or class map.

The basic idea is to provide tools which can take in one or more css styling objects representing the styles for a given element, and return a single class name. If the same set of styling is passed in, the same name returns and nothing is re-registered.

## Motivation

Defining rules at runtime has a number of benefits over traditional build time staticly produced css:

- Only register classes that are needed, when they're needed, reducing the overall selector count and improving TTG.

- Dynamically create new class permutations based on contextual theming requirements. (Use a different theme inside of a DIV without downloading multiple copies of the css rule definitions.)

- Use JavaScript to define the class content (using utilities like color converters, or reusing constant numbers becomes possible.)

- Allow control libraries to merge customized styling in with their rules, avoiding complexities like css selector specificity.

- Simplify RTL processing; lefts become rights in RTL, in the actual rules. No complexity like `html[dir=rtl]` prefixes necessary, which alleviates unexpected specificity bugs. (You can use `/* noflip */` comments to avoid flipping if needed.)

- Reduce bundle size. Automatically handles vendor prefixing, unit providing, RTL flipping, and margin/padding expansion (e.g. margin will automatically expand out to margin TRBL, so that we avoid specificity problems when merging things together.)

- Reduce the build time overhead of running through CSS preprocessors.

- TypeScript type safety; spell "background" wrong and get build breaks.

## What tradeoffs are there? Are there downsides to using JavaScript to process styling?

In static solutions, there is very little runtime evaluation required; everything is injected as-is. Things like auto prefixing and language specific processing like sass mixins are all evaluated at build time.

In runtime styling, much of this is evaluated in the browser, so you are paying a cost in doing this. However, with performance optimizations like memoization, you can minimize this quite a bit, and you gain all of the robustness enumerated above.

# API

The api surfaces consists of 3 methods and a handful of interfaces:

`mergeStyles(..args[]: IStyle[]): string` - Takes in one or more style objects, merges them in the right order, and produces a single css class name which can be injected into any component.

`mergeStyleSet(...args[]: IStyleSet[]): { [key: string]: string }` - Takes in one or more style set objects, each consisting of a set of areas, each which will produce a class name. Using this is analogous to calling mergeStyles for each property in the object, but ensures we maintain the set ordering when multiple style sets are merged.

`concatStyleSet(...args[]: IStyleSet[]): IStyleSet` - In some cases you simply need to combine style sets, without actually generating class names (it is costs in performance to generate class names.) This tool returns a single set merging many together.

## Vocabulary

A **style object** represents the collection of css rules, except that the names are camelCased rather than kebab-cased. Example:

```tsx
let style = {
  backgroundColor: 'red',
  left: 42
};
```

Additionally, **style objects** can contain selectors under the `selectors` property:

```tsx
let style = {
  backgroundColor: 'red',
  selectors: {
    ':hover': {
      backgroundColor: 'blue';
    },
    '.parent &': { /* parent selector */ },
    '& .child': { /* child selector */ }
  }
};
```

A **style set** represents a map of area to style object. When building a component, you need to generate a class name for each element that requires styling. You would defint this in a **style set**.

```tsx
let styleSet = {
  root: { background: 'red' },
  button: { margin: 42 }
};
```

## Basic usage

When building a component, you will need a **style set** map of class names to inject into your elements' class attributes.

The recommended pattern is to provide the classnames in a separate function, typically in a separate file `ComponentName.classNames.ts`.

```tsx
import { IStyle, mergeStyleSets } from '@uifabric/merge-styles';

export interface IComponentClassNames {
  root: string;
  button: string;
  buttonIcon: string;
}

export const getClassNames = (): IComponentClassNames => {
  return mergeStyleSets({
    root: {
        background: 'red'
      }
    ),

    button: {
      backgroundColor: 'green',
    },

    buttonIcon: {
      margin: 10
    }
  });
};
```

The class map can then be used in a component:

```tsx
import { getClassNames } from './MyComponent.classNames';

export const MyComponent = () => {
  let { root, button, buttonIcon } = getClassNames();

  return (
    <div className={root}>
      <button className={button}>
        <i className={buttonIcon} />
      </button>
    </div>
  );
};
```

## Selectors

### Basic pseudo-selectors (:hover, :active, etc)

Custom selectors can be defined within `IStyle` definitions under the `selectors` section:

```tsx
{
  background: 'red',
  selectors: {
    ':hover': {
      background: 'green'
    }
  }
}
```

By default, the rule will be appended to the current selector scope. That is, in the above scenario, there will be 2 rules inserted when using `mergeStyles`:

```css
.css-0 {
  background: red;
}
.css-0:hover {
  background: green;
}
```

### Parent/child selectors

In some cases, you may need to use parent or child selectors. To do so, you can define a selector from scratch and use the `&` character to represent the generated class name. When using the `&`, the current scope is ignored. Example:

```tsx
{
  selectors: {
    // selector relative to parent
    '.ms-Fabric--isFocusVisible &': {
      background: 'red'
    }
    // selector for child
    '& .child' {
      background: 'green'
    }
  }
}
```

This would register the rules:

```css
.ms-Fabric--isFocusVisible .css-0 {
  background: red;
}
.css-0 .child {
  background: green;
}
```

### Global selectors

While we suggest avoiding global selectors, there are some cases which make sense to register things globally. Keep in mind that global selectors can't be guaranteed unique and may suffer from specificity problems and versioning issues in the case that two different versions of your library get rendered on the page.

To register a selector globally, wrap it in a `:global()` wrapper:

```tsx
{
  selectors: {
    ':global(button)': {
      overflow: 'visible'
    }
  }
}
```

### Media and feature queries

Media queries can be applied via selectors. For example, this style will produce a class which has a red background when above 600px, and green when at or below 600px:

```tsx
mergeStyles({
  background: 'red',
  selectors: {
    '@media(max-width: 600px)': {
      background: 'green'
    },
    '@supports(display: grid)': {
      display: 'grid'
    }
  }
});
```

Produces:

```css
.css-0 {
  background: red;
}

@media (max-width: 600px) {
  .css-0 {
    background: green;
  }
}

@supports (display: grid) {
  .css-0 {
    display: grid;
  }
}
```

### Referencing child elements within the mergeStyleSets scope

One important concept about `mergeStyleSets` is that it produces a map of class names for the given elements:

```tsx
mergeStyleSets({
  root: { background: 'red' }
  thumb: { background: 'green' }
});
```

Produces:

```css
.root-0 {
  background: red;
}
.thumb-1 {
  background: green;
}
```

In some cases, you may need to alter a child area by interacting with the parent. For example, when the parent is hovered, change the child background. You can reference the areas defined in the style set using $ tokens:

```tsx
mergeStyleSets({
  root: {
    selectors: {
      ':hover $thumb': { background: 'lightgreen' }
    }
   }
  thumb: { background: 'green' }
});
```

The `$thumb` reference in the selector on root will be replaced with the class name generated for thumb.

## Custom class names

By default when using `mergeStyles`, class names that are generated will use the prefix `css-` followed by a number, creating unique rules where needed. For example, the first class name produced will be 'css-0'.

When using `mergeStyleSets`, class names automatically use the area name as the prefix.

Merging rules like:

```ts
mergeStyleSets({ a: { ... }, b: { ... } })
```

Will produce the class name map:

```ts
{ a: 'a-0', b: 'b-1' }
```

If you'd like to override the default prefix in either case, you can pass in a `displayName` to resolve this:

```tsx
{
  displayName: 'MyComponent',
  background: 'red'
}
```

This generates:

```css
.MyComponent-0 {
  background: red;
}
```

## Managing conditionals and states

Style objects can be represented by a simple object, but also can be an array of the objects. The merge functions will handle arrays and merge things together in the given order. They will also ignore falsey values, allowing you to conditionalize the results.

In the following example, the root class generated will be different depending on the `isToggled` state:

```tsx
export const getClassNames = (isToggled: boolean): IComponentClassNames => {
  return mergeStyleSet({
    root: [
      {
        background: 'red'
      },
      isToggled && {
        background: 'green'
      }
    ]
  });
};
```

## RTL support

By default, nearly all of the major rtl-sensitive CSS properties will be auto flipped when the dir="rtl" flag is present on the `HTML` tag of the page.

There are some rare scenarios (linear-gradients, etc) which are not flipped, for the sake of keeping the bundle size to a minimum. If there are missing edge cases, please submit a PR to address.

In rare condition where you want to avoid auto flipping, you can annotate the rule with the `@noflip` directive:

```tsx
mergeStyles({
  left: '42px @noflip'
});
```

## Optimizing for performance

Resolving the class names on every render can be an unwanted expense especially in hot spots where things are rendered frequently. To optimize, we recommend 2 guidelines:

1. For your `getClassNames` function, flatten all input parameters into simple immutable values. This helps the `memoizeFunction` utility to cache the results based on the input.

2. Use the `memoizeFunction` function from the `@uifabric/utilities` package to cache the results, given a unique combination of inputs. Example:

```tsx
import { memoizeFunction } from '@uifabric/utilities';

export const getClassNames = memoizeFunction((isToggled: boolean) => {
  return mergeStyleSet({
    // ...
  });
});
```

## Registering fonts

Registering font faces example:

```tsx
import { fontFace } from '@uifabric/merge-styles';

fontFace({
  fontFamily: `"Segoe UI"`,
  src: `url("//cdn.com/fontface.woff2) format(woff2)`,
  fontWeight: 'normal'
});
```

Note that in cases like `fontFamily` you may need to embed quotes in the string as shown above.

## Registering keyframes

Registering animation keyframes example:

```tsx
import { keyframes, mergeStyleSets } from '@uifabric/merge-styles';

let fadeIn = keyframes({
  from: {
    opacity: 0
  },
  to: {
    opacity: 1
  }
});

export const getClassNames = () => {
  return mergeStyleSets({
    root: {
      animationName: fadeIn
    }
  });
};
```

## Server-side rendering

You can import `renderStatic` method from the `/lib/server` entry to render content and extract the css rules that would have been registered, as a string.

Example:

```tsx
import { renderStatic } from '@uifabric/merge-styles/lib/server';

let { html, css } = renderStatic(() => {
  return ReactDOM.renderToString(...);
});
```

Caveats for server-side rendering (TODOs):

- Currently font face definitions and keyframes won't be included in the result.

- Using the `memoizeFunction` utility may short circuit calling merge-styles APIs to register styles, which may cause the helper here to skip returning css. This can be fixed, but it is currently a known limitation.

- Until all Fabric components use the merge-styles library, this will only return a subset of the styling. Also a known limitation and work in progress.

- The rehydration logic has not yet been implemented, so we may run into issues when you rehydrate.

- Only components which USE mergeStyles will have their css included. In Fabric, not all components have been converted from using SASS yet.
