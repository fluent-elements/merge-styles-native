import { mergeStyles } from './mergeStyles';
import { Stylesheet, InjectionMode } from './Stylesheet';

const _stylesheet: Stylesheet = Stylesheet.getInstance();

_stylesheet.setConfig({ injectionMode: InjectionMode.none });

describe('mergeStyles', () => {
  beforeEach(() => {
    _stylesheet.reset();
  });

  it('can register the same static class twice', () => {
    expect(mergeStyles('a', 'a')).toEqual('a');
  });

  it('can register left', () => {
    mergeStyles({ left: 10 });
    expect(_stylesheet.getRules()).toEqual('.css-0{left:10;}');
  });

  it('can join strings', () => {
    expect(mergeStyles('a', false, null, undefined, 'b')).toEqual('a b');
  });

  it('can join arrays of strings', () => {
    expect(mergeStyles(['a', 'b', 'c'], false, null, undefined)).toEqual('a b c');
  });

  it('can join an object and style', () => {
    expect(mergeStyles('foo', { color: 'white' })).toEqual('foo css-0');
  });

  it('can mix styles and classnames together', () => {
    expect(mergeStyles('foo', { backgroundColor: 'red' })).toEqual('foo css-0');
    expect(_stylesheet.getRules()).toEqual('.css-0{background-color:red;}');
  });

  it('can remerge styles', () => {
    const className: string = mergeStyles({ backgroundColor: 'red', color: 'black' });
    const newClassName = mergeStyles(className, { color: 'white' });

    expect(className).toEqual('css-0');
    expect(newClassName).toEqual('css-1');
    expect(_stylesheet.getRules()).toEqual('.css-0{background-color:red;color:black;}' + '.css-1{background-color:red;color:white;}');
  });

  it('can normalize margins', () => {
    mergeStyles({ margin: 4 }, { marginRight: 8 });
    expect(_stylesheet.getRules()).toEqual('.css-0{margin-top:4;margin-right:8;margin-bottom:4;margin-left:4;}');
  });

  it('can expand className lists', () => {
    const classes1 = mergeStyles('ms-Foo', { backgroundColor: 'red' });
    const classes2 = mergeStyles(classes1, { backgroundColor: 'green' });

    expect(classes2).toEqual('ms-Foo css-1');
    expect(_stylesheet.getRules()).toEqual('.css-0{background-color:red;}' + '.css-1{background-color:green;}');
  });
});
