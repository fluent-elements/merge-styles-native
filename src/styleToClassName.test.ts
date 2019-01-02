import { InjectionMode, Stylesheet } from './Stylesheet';

import { setRTL } from './transforms/rtlifyRules';
import { styleToClassName } from './styleToClassName';
import { renderStatic } from './server';

const _stylesheet: Stylesheet = Stylesheet.getInstance();

_stylesheet.setConfig({ injectionMode: InjectionMode.none });

describe('styleToClassName', () => {
  beforeEach(() => {
    _stylesheet.reset();
  });

  it('can register classes and avoid re-registering', () => {
    let className = styleToClassName({ backgroundColor: 'red' });

    expect(className).toEqual('css-0');
    expect(_stylesheet.getRules()).toEqual('.css-0{background-color:red;}');

    className = styleToClassName({ backgroundColor: 'red' });

    expect(className).toEqual('css-0');
    expect(_stylesheet.getRules()).toEqual('.css-0{background-color:red;}');

    className = styleToClassName({ backgroundColor: 'green' });

    expect(className).toEqual('css-1');
    expect(_stylesheet.getRules()).toEqual('.css-0{background-color:red;}.css-1{background-color:green;}');
  });

  it('ignores child selectors', () => {
    styleToClassName({
      selectors: {
        '.foo': { backgroundColor: 'red' }
      }
    });

    expect(_stylesheet.getRules()).toEqual('');
  });

  it('filters child selectors', () => {
    styleToClassName({
      backgroundColor: 'red',
      selectors: {
        '.foo': { backgroundColor: 'green' }
      }
    });

    expect(_stylesheet.getRules()).toEqual('.css-0{background-color:red;}');
  });

  it('can merge rules', () => {
    let className = styleToClassName(null, false, undefined, { backgroundColor: 'red', color: 'white' }, { backgroundColor: 'green' });

    expect(className).toEqual('css-0');
    expect(_stylesheet.getRules()).toEqual('.css-0{background-color:green;color:white;}');

    className = styleToClassName({ backgroundColor: 'green', color: 'white' });
    expect(className).toEqual('css-0');
  });

  it('returns blank string with no input', () => {
    expect(styleToClassName()).toEqual('');
  });

  it('does not emit a rule which has an undefined value', () => {
    expect(styleToClassName({ fontFamily: undefined })).toEqual('');
    expect(_stylesheet.getRules()).toEqual('');
  });

  it('returns the same class name for a rule that only has a displayName', () => {
    expect(styleToClassName({ displayName: 'foo' })).toEqual('foo-0');
    expect(styleToClassName({ displayName: 'foo' })).toEqual('foo-0');
    expect(_stylesheet.getRules()).toEqual('');
  });

  it('can preserve displayName in names', () => {
    expect(styleToClassName({ displayName: 'DisplayName', backgroundColor: 'red' })).toEqual('DisplayName-0');
    expect(_stylesheet.getRules()).toEqual('.DisplayName-0{background-color:red;}');
  });

  it('can expand previously defined rules', () => {
    const className = styleToClassName({ backgroundColor: 'red' });
    const newClassName = styleToClassName(className, { color: 'white' });

    expect(newClassName).toEqual('css-1');
    expect(_stylesheet.getRules()).toEqual('.css-0{background-color:red;}.css-1{background-color:red;color:white;}');
  });

  it('can expand an array of rules', () => {
    styleToClassName([{ backgroundColor: 'red' }, { backgroundColor: 'white' }]);
    expect(_stylesheet.getRules()).toEqual('.css-0{background-color:white;}');
  });

  it('ignores undefined property values', () => {
    styleToClassName({
      backgroundColor: 'red',
      color: undefined
    });

    expect(_stylesheet.getRules()).toEqual('.css-0{background-color:red;}');
  });
});
