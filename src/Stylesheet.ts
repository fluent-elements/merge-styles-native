declare var global: any;

import { RegisteredStyle, StyleSheet as StyleSheetNative } from 'react-native';

import { IStyle } from './IStyle';

export type NativeStyle = { rules: { [key: string]: any } };

export const InjectionMode = {
  /**
   * Avoids style injection, use getRules() to read the styles.
   */
  none: 0 as 0,

  /**
   * Inserts rules using the insertRule api.
   */
  insertNode: 1 as 1,

  /**
   * Appends rules using appendChild.
   */
  appendChild: 2 as 2
};

export type InjectionMode = typeof InjectionMode[keyof typeof InjectionMode];

/**
 * Stylesheet config.
 *
 * @public
 */
export interface IStyleSheetConfig {
  /**
   * Injection mode for how rules are inserted.
   */
  injectionMode?: InjectionMode;

  /**
   * Default 'displayName' to use for a className.
   * @defaultvalue 'css'
   */
  defaultPrefix?: string;

  /**
   * Default 'namespace' to attach before the className.
   */
  namespace?: string;

  /**
   * Callback executed when a rule is inserted.
   */
  onInsertRule?: (rules: { [key: string]: any }) => void;
}

const STYLESHEET_SETTING = '__stylesheet__';

let _stylesheet: Stylesheet;

/**
 * Represents the state of styles registered in the page. Abstracts
 * the surface for adding styles to the stylesheet, exposes helpers
 * for reading the styles registered in server rendered scenarios.
 *
 * @public
 */
export class Stylesheet {
  private _rules: { className: string; rules: { [key: string]: any } }[] = [];
  private _config: IStyleSheetConfig;
  private _counter = 0;
  private _keyToClassName: { [key: string]: string } = {};
  private _onResetCallbacks: (() => void)[] = [];

  // tslint:disable-next-line:no-any
  private _classNameToArgs: { [key: string]: { args: any; rules: { [key: string]: string }; nativeStyle?: NativeStyle } } = {};

  /**
   * Gets the singleton instance.
   */
  public static getInstance(): Stylesheet {
    _stylesheet = global[STYLESHEET_SETTING] as Stylesheet;

    if (!_stylesheet) {
      // tslint:disable-next-line:no-string-literal
      const fabricConfig = (global && global['FabricConfig']) || {};
      _stylesheet = global[STYLESHEET_SETTING] = new Stylesheet(fabricConfig.mergeStyles);
    }

    return _stylesheet;
  }

  constructor(config?: IStyleSheetConfig) {
    this._config = {
      injectionMode: InjectionMode.insertNode,
      defaultPrefix: 'css',
      namespace: undefined,
      ...config
    };
  }

  /**
   * Configures the stylesheet.
   */
  public setConfig(config?: IStyleSheetConfig): void {
    this._config = {
      ...this._config,
      ...config
    };
  }

  /**
   * Configures a reset callback.
   *
   * @param callback - A callback which will be called when the Stylesheet is reset.
   */
  public onReset(callback: () => void): void {
    this._onResetCallbacks.push(callback);
  }

  /**
   * Generates a unique classname.
   *
   * @param displayName - Optional value to use as a prefix.
   */
  public getClassName(displayName?: string): string {
    const { namespace } = this._config;
    const prefix = displayName || this._config.defaultPrefix;

    return `${namespace ? namespace + '-' : ''}${prefix}-${this._counter++}`;
  }

  /**
   * Used internally to cache information about a class which was
   * registered with the stylesheet.
   */
  public cacheClassName(className: string, key: string, args: IStyle[], rules: { [key: string]: string }, nativeStyle?: NativeStyle): void {
    this._keyToClassName[key] = className;
    this._classNameToArgs[className] = {
      args,
      rules,
      nativeStyle
    };
  }

  /**
   * Gets the appropriate classname given a key which was previously
   * registered using cacheClassName.
   */
  public classNameFromKey(key: string): string | undefined {
    return this._keyToClassName[key];
  }

  /**
   * Gets the arguments associated with a given classname which was
   * previously registered using cacheClassName.
   */
  public argsFromClassName(className: string): IStyle[] | undefined {
    const entry = this._classNameToArgs[className];

    return entry && entry.args;
  }

  /**
   * Gets the React Native style associated with a given classname which was
   * previously registered using cacheClassName.
   */
  public styleFromClassName(className: string): RegisteredStyle<any> | undefined {
    const entry = this._classNameToArgs[className];

    return entry && entry.nativeStyle && (entry.nativeStyle.rules as any);
  }

  /**
   * Gets the arguments associated with a given classname which was
   * previously registered using cacheClassName.
   */
  public insertedRulesFromClassName(className: string): { [key: string]: any } | undefined {
    const entry = this._classNameToArgs[className];

    return entry && entry.rules;
  }

  /**
   * Creates a React Native style.
   */
  public createStyle(className: string, rules: { [key: string]: any }): NativeStyle | undefined {
    let nativeStyle: NativeStyle | undefined;

    switch (this._config.injectionMode) {
      case InjectionMode.insertNode:
      case InjectionMode.appendChild:
        nativeStyle = StyleSheetNative.create({ rules });
        break;
    }

    this._rules.push({ className, rules });

    if (this._config.onInsertRule) {
      this._config.onInsertRule(rules);
    }

    return nativeStyle;
  }

  /**
   * Gets all rules registered with the stylesheet in a CSS readable format.
   */
  public getRules(): string {
    return this._rules
      .map(rule =>
        Object.keys(rule.rules).length > 0
          ? '.' +
            rule.className +
            JSON.stringify(rule.rules)
              .replace(/([A-Z])/g, '-$1')
              .toLowerCase()
              .replace(/"/g, '')
              .replace(/,/g, ';')
              .replace(/}/g, ';}')
          : ''
      )
      .join('');
  }

  /**
   * Resets the internal state of the stylesheet. Only used in server
   * rendered scenarios where we're using InsertionMode.none.
   */
  public reset(): void {
    this._rules = [];
    this._counter = 0;
    this._classNameToArgs = {};
    this._keyToClassName = {};

    this._onResetCallbacks.forEach((callback: () => void) => callback());
  }

  // Forces the regeneration of incoming styles without totally resetting the stylesheet.
  public resetKeys(): void {
    this._keyToClassName = {};
  }
}
