// @public
export function concatStyleSets(...styleSets: (IStyleSet<any> | false | null | undefined)[]): IConcatenatedStyleSet<any>;

// @public
interface IFontFace extends IRawFontStyle {
  fontFeatureSettings?: string;
  src?: string;
  unicodeRange?: ICSSRule | string;
}

// @public
interface IRawStyle extends IRawStyleBase {
  displayName?: string;
  selectors?: {
    [key: string]: IStyle;
  }
}

// @public
interface IStyleSheetConfig {
  defaultPrefix?: string;
  injectionMode?: InjectionMode;
  namespace?: string;
  onInsertRule?: (rules: {
          [key: string]: any;
      }) => void;
}

// @public
export function mergeStyles(...args: (IStyle | IStyleBaseArray | false | null | undefined)[]): string;

// @public
export function mergeStyleSets(...styleSets: Array<IStyleSet<any> | undefined | false | null>): IProcessedStyleSet<any>;

// @public
class Stylesheet {
  constructor(config?: IStyleSheetConfig);
  argsFromClassName(className: string): IStyle[] | undefined;
  // WARNING: The type "NativeStyle" needs to be exported by the package (e.g. added to index.ts)
  cacheClassName(className: string, key: string, args: IStyle[], rules: {
          [key: string]: string;
      }, nativeStyle?: NativeStyle): void;
  classNameFromKey(key: string): string | undefined;
  // WARNING: The type "NativeStyle" needs to be exported by the package (e.g. added to index.ts)
  createStyle(className: string, rules: {
          [key: string]: any;
      }): NativeStyle | undefined;
  getClassName(displayName?: string): string;
  static getInstance(): Stylesheet;
  getRules(): string;
  insertedRulesFromClassName(className: string): {
          [key: string]: any;
      } | undefined;
  onReset(callback: () => void): void;
  reset(): void;
  // (undocumented)
  resetKeys(): void;
  setConfig(config?: IStyleSheetConfig): void;
  styleFromClassName(className: string): RegisteredStyle<any> | undefined;
}

// WARNING: Unsupported export: IStyle
// WARNING: Unsupported export: IStyleFunction
// WARNING: Unsupported export: IStyleFunctionOrObject
// WARNING: Unsupported export: IConcatenatedStyleSet
// WARNING: Unsupported export: IProcessedStyleSet
// WARNING: Unsupported export: IStyleSet
// WARNING: Unsupported export: IFontWeight
// WARNING: Unsupported export: InjectionMode
// WARNING: Unsupported export: InjectionMode
// (No @packagedocumentation comment for this package)
