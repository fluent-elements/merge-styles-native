import { mergeStyleSets } from './mergeStyleSets';
import { Stylesheet, InjectionMode } from './Stylesheet';
import { IStyleSet } from './IStyleSet';
import { IStyleFunctionOrObject } from './IStyleFunction';
import { IStyle } from './IStyle';

const _stylesheet: Stylesheet = Stylesheet.getInstance();

_stylesheet.setConfig({ injectionMode: InjectionMode.none });

describe('mergeStyleSets', () => {
  beforeEach(() => {
    _stylesheet.reset();
  });

  it('can merge style sets', () => {
    const fn1 = jest.fn().mockReturnValue({
      root: { backgroundColor: 'green', fontSize: 12 }
    });

    const fn2 = jest.fn().mockReturnValue({
      root: {
        backgroundColor: 'yellow',
        color: 'pink'
      }
    });

    const empty: { c?: string } = {};
    const result = mergeStyleSets(
      empty,
      {
        root: { backgroundColor: 'red' },
        a: { backgroundColor: 'green' },
        subComponentStyles: {
          labelStyles: fn1
        }
      },
      {
        a: { backgroundColor: 'white' },
        b: { backgroundColor: 'blue' }
      },
      {
        root: { backgroundColor: 'yellow' },
        subComponentStyles: {
          labelStyles: fn2
        }
      }
    );

    expect(result.root).toBe('root-0');
    expect(result.a).toBe('a-1');
    expect(result.b).toBe('b-2');
    expect(result.subComponentStyles).toBeDefined();
    const mergedLabelStyles = result.subComponentStyles!.labelStyles({});
    expect(mergedLabelStyles).toEqual({
      root: [{ backgroundColor: 'green', fontSize: 12 }, { backgroundColor: 'yellow', color: 'pink' }]
    });

    expect(_stylesheet.getRules()).toEqual(
      '.root-0{background-color:yellow;}' + '.a-1{background-color:white;}' + '.b-2{background-color:blue;}'
    );
  });

  it('can merge correctly when falsey values are provided as inputs', () => {
    const result = mergeStyleSets(
      undefined,
      {
        root: { backgroundColor: 'red' },
        a: { backgroundColor: 'green' }
      },
      null,
      {
        a: { backgroundColor: 'white' },
        b: { backgroundColor: 'blue' }
      }
    );

    expect(result.root).toBe('root-0');
    expect(result.a).toBe('a-1');
    expect(result.b).toBe('b-2');

    expect(_stylesheet.getRules()).toEqual(
      '.root-0{background-color:red;}' + '.a-1{background-color:white;}' + '.b-2{background-color:blue;}'
    );
  });

  it('can merge correctly when all inputs are falsey', () => {
    // poor 0 is missing out on the party.
    // he will not be missed.
    const result = mergeStyleSets(undefined, false, null);

    expect(result).toEqual({ subComponentStyles: {} });
    expect(_stylesheet.getRules()).toBe('');
  });

  it('can merge class names', () => {
    expect(mergeStyleSets({ root: ['a', 'b', { backgroundColor: 'red' }] })).toEqual({
      root: 'a b root-0',
      subComponentStyles: {}
    });
  });

  it('can auto expand a previously registered style', () => {
    const styles = mergeStyleSets({ root: { backgroundColor: 'red' } });
    const styles2 = mergeStyleSets({ root: [{ backgroundColor: 'purple' }, styles.root] });

    expect(styles.root).toEqual(styles2.root);

    expect(_stylesheet.getRules()).toEqual('.root-0{background-color:red;}');
  });

  it('can normalize duplicate static class names', () => {
    const styles = mergeStyleSets({ root: ['a', { backgroundColor: 'red' }] });
    const styles1 = mergeStyleSets(styles, styles);

    expect(styles1).toEqual({ root: 'a root-0', subComponentStyles: {} });
  });

  it('can auto expand a previously registered style embedded in static classname', () => {
    const styles = mergeStyleSets({ root: ['a', { backgroundColor: 'red' }] });
    const styles2 = mergeStyleSets({ root: ['b', { backgroundColor: 'purple' }] }, styles);
    const styles3 = mergeStyleSets(styles, { root: ['b', { backgroundColor: 'purple' }] });
    const styles4 = mergeStyleSets(styles, styles2, styles3, { root: 'c' });

    expect(styles).toEqual({ root: 'a root-0', subComponentStyles: {} });
    expect(styles2).toEqual({ root: 'b a root-0', subComponentStyles: {} });
    expect(styles3).toEqual({ root: 'a b root-1', subComponentStyles: {} });
    expect(styles4).toEqual({ root: 'a b c root-1', subComponentStyles: {} });
  });

  it('can merge two sets with class names', () => {
    const styleSet1 = mergeStyleSets({
      root: ['ms-Foo', { backgroundColor: 'red' }]
    });
    const styleSet2 = mergeStyleSets(styleSet1, {
      root: ['ms-Bar', { backgroundColor: 'green' }]
    });

    expect(styleSet2).toEqual({ root: 'ms-Foo ms-Bar root-1', subComponentStyles: {} });
    expect(_stylesheet.getRules()).toEqual('.root-0{background-color:red;}' + '.root-1{background-color:green;}');
  });

  describe('typings tests', () => {
    interface ISubComponentStyles extends IStyleSet<ISubComponentStyles> {
      root: IStyle;
    }

    interface ISubComponentStyleProps {
      isCollapsed: boolean;
    }

    interface IStyles extends IStyleSet<IStyles> {
      root: IStyle;
      subComponentStyles: {
        button: IStyleFunctionOrObject<ISubComponentStyleProps, IStyleSet<ISubComponentStyles>>;
      };
    }

    interface IStylesWithStyleObjectAsSubCommponent extends IStyleSet<IStyles> {
      root: IStyle;
      subComponentStyles: {
        button: Partial<IStyleSet<ISubComponentStyles>>;
      };
    }

    /** Button component as of test writing has this interface. */
    const LegacySubComponent: (props: { styles: Partial<ISubComponentStyles> }) => any = (props: {
      styles: Partial<ISubComponentStyles>;
    }) => {
      return;
    };

    const SubComponent: (props: { styles: IStyleFunctionOrObject<ISubComponentStyleProps, ISubComponentStyles> }) => any = (props: {
      styles: IStyleFunctionOrObject<ISubComponentStyleProps, ISubComponentStyles>;
    }) => {
      return;
    };

    const getStyles = (): IStyles => ({
      root: {
        backgroundColor: 'red'
      },
      subComponentStyles: {
        button: () => ({
          root: {
            backgroundColor: 'green'
          }
        })
      }
    });

    it('IStyleSet/IProcessedStyleSet should work with standard sub components', () => {
      const classNames = mergeStyleSets<IStyles>(getStyles());

      SubComponent({ styles: classNames.subComponentStyles.button });

      // this test primarily tests that the lines above do not result in a Typescript error.
      expect.assertions(0);
    });

    it('IStyleSet/IProcessedStyleSet should work with legacy sub components that only take IStyleFunctions', () => {
      const classNames = mergeStyleSets<IStyles>(getStyles());

      LegacySubComponent({ styles: classNames.subComponentStyles.button({ isCollapsed: false }) });

      // this test primarily tests that the lines above do not result in a Typescript error.
      expect.assertions(0);
    });

    describe('IStylesWithStyleObjectAsSubCommponent', () => {
      const getStyles2 = (): IStylesWithStyleObjectAsSubCommponent => ({
        root: {
          backgroundColor: 'red'
        },
        subComponentStyles: {
          button: {
            root: {
              backgroundColor: 'green'
            }
          }
        }
      });

      it('IStyleSet/IProcessedStyleSet should work with standard sub components', () => {
        const classNames = mergeStyleSets<IStyles>(getStyles2());

        // this test primarily
        SubComponent({ styles: classNames.subComponentStyles.button });

        // this test primarily tests that the lines above do not result in a Typescript error.
        expect.assertions(0);
      });

      it('IStyleSet/IProcessedStyleSet should work with legacy sub components that only take IStyleFunctions', () => {
        const classNames = mergeStyleSets<IStylesWithStyleObjectAsSubCommponent>(getStyles2());

        LegacySubComponent({ styles: classNames.subComponentStyles.button({ isCollapsed: false }) });

        // this test primarily tests that the lines above do not result in a Typescript error.
        expect.assertions(0);
      });
    });
  });
});
