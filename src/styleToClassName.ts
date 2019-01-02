import { IRawStyle, IStyle } from './IStyle';

import { Stylesheet } from './Stylesheet';

const DISPLAY_NAME = 'displayName';

const REACT_NATIVE_PROPS = [
  'alignContent',
  'alignItems',
  'alignSelf',
  'aspectRatio',
  'backfaceVisibility',
  'backgroundColor',
  'borderBottomColor',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderBottomWidth',
  'borderColor',
  'borderLeftColor',
  'borderLeftWidth',
  'borderRadius',
  'borderRightColor',
  'borderRightWidth',
  'borderStyle',
  'borderTopColor',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderTopWidth',
  'borderWidth',
  'bottom',
  'color',
  'decomposedMatrix',
  'direction',
  'display',
  'elevation',
  'flex',
  'flexBasis',
  'flexDirection',
  'flexGrow',
  'flexShrink',
  'flexWrap',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'height',
  'includeFontPadding',
  'justifyContent',
  'left',
  'letterSpacing',
  'lineHeight',
  'margin',
  'marginBottom',
  'marginHorizontal',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginVertical',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'opacity',
  'overflow',
  'overlayColor',
  'padding',
  'paddingBottom',
  'paddingHorizontal',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingVertical',
  'position',
  'resizeMode',
  'right',
  'rotation',
  'scaleX',
  'scaleY',
  'shadowColor',
  'shadowOffset',
  'shadowOpacity',
  'shadowRadius',
  'textAlign',
  'textAlignVertical',
  'textDecorationColor',
  'textDecorationLine',
  'textDecorationStyle',
  'textShadowColor',
  'textShadowOffset',
  'textShadowRadius',
  'tintColor',
  'top',
  'transform',
  'transformMatrix',
  'translateX',
  'translateY',
  'width',
  'writingDirection',
  'zIndex'
];

// tslint:disable-next-line:no-any
type IDictionary = { [key: string]: any };

interface IRuleSet {
  __order: string[];
  [key: string]: IDictionary;
}

// tslint:disable-next-line:no-any
type IRules = { [key: string]: any };

function getDisplayName(rules?: IRawStyle): string | undefined {
  return rules ? rules[DISPLAY_NAME] : undefined;
}

function extractRules(args: IStyle[], rules: IRules = {}): IRules {
  const stylesheet = Stylesheet.getInstance();

  for (const arg of args) {
    // If the arg is a string, we need to look up the class map and merge.
    if (typeof arg === 'string') {
      const expandedRules = stylesheet.argsFromClassName(arg);

      if (expandedRules) {
        extractRules(expandedRules, rules);
      }
      // Else if the arg is an array, we need to recurse in.
    } else if (Array.isArray(arg)) {
      extractRules(arg, rules);
    } else {
      // tslint:disable-next-line:no-any
      for (const prop in arg as any) {
        if (prop === 'selectors') {
          // Skip selectors - not used in React Native
          // tslint:disable-next-line:no-empty
        } else {
          if ((arg as any)[prop] !== undefined) {
            // Else, add the rule.
            if (prop === 'margin' || prop === 'padding') {
              // tslint:disable-next-line:no-any
              expandQuads(rules, prop, (arg as any)[prop]);
            } else if (prop === DISPLAY_NAME || binarySearch(REACT_NATIVE_PROPS, prop) !== -1) {
              // tslint:disable-next-line:no-any
              rules[prop] = (arg as any)[prop] as any;
            }
          }
        }
      }
    }
  }

  return rules;
}

function expandQuads(currentRules: IRules, name: string, value: string): void {
  const parts = typeof value === 'string' ? value.split(' ') : [value];

  currentRules[name + 'Top'] = parts[0];
  currentRules[name + 'Right'] = parts[1] || parts[0];
  currentRules[name + 'Bottom'] = parts[2] || parts[0];
  currentRules[name + 'Left'] = parts[3] || parts[1] || parts[0];
}

function getKeyForRules(rules: IRules): string | undefined {
  const serialized: string[] = [];
  let hasProps = false;

  for (const propName in rules) {
    if (rules.hasOwnProperty(propName) && rules[propName] !== undefined) {
      hasProps = true;
      serialized.push(propName, rules[propName]);
    }
  }

  return hasProps ? serialized.join('') : undefined;
}

export interface IRegistration {
  className: string;
  key: string;
  args: IStyle[];
  rulesToInsert: IRules;
}

export function styleToRegistration(...args: IStyle[]): IRegistration | undefined {
  const rules = extractRules(args);
  const key = getKeyForRules(rules);

  if (key) {
    const stylesheet = Stylesheet.getInstance();
    const registration: Partial<IRegistration> = {
      className: stylesheet.classNameFromKey(key),
      key,
      args
    };

    if (!registration.className) {
      const displayName = getDisplayName(rules);
      registration.className = stylesheet.getClassName(displayName);
      if (rules && displayName) {
        delete rules[DISPLAY_NAME];
      }
      registration.rulesToInsert = rules;
    }

    return registration as IRegistration;
  }
}

export function applyRegistration(registration: IRegistration, classMap?: { [key: string]: string }): void {
  const stylesheet = Stylesheet.getInstance();
  const { className, key, args, rulesToInsert } = registration;

  if (rulesToInsert) {
    const style = stylesheet.createStyle(className, rulesToInsert);
    stylesheet.cacheClassName(className!, key!, args!, rulesToInsert, style);
  }
}

export function styleToClassName(...args: IStyle[]): string {
  const registration = styleToRegistration(...args);
  if (registration) {
    applyRegistration(registration);
    return registration.className;
  }

  return '';
}

function binarySearch(sortedArray: string[], value: string) {
  let start = 0;
  let end = sortedArray.length - 1;

  while (start <= end) {
    let mid = Math.floor((start + end) / 2);
    if (sortedArray[mid] === value) {
      return mid;
    }
    if (value < sortedArray[mid]) {
      end = mid - 1;
    } else {
      start = mid + 1;
    }
  }
  return -1;
}
