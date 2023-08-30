import { applyTransform } from '@hypermod/utils';
import * as transformer from './transform';
import prettier from 'prettier';

function format(source: string): string {
  return prettier
    .format(source, {
      parser: 'typescript',
      trailingComma: 'all',
      semi: true,
      tabWidth: 2,
      useTabs: false,
      singleQuote: true,
      printWidth: 100,
    })
    .trim();
}

describe('memoize-one@5.0.0 transform', () => {
  it('should not touch usages that do not use a custom equality function', async () => {
    const result = await applyTransform(
      transformer,
      format(`
        import memoize from 'memoize-one';

        function add(a: number, b: number) {
          return a + b;
        }

        const memoized = memoize(add);
      `),
      { parser: 'tsx' },
    );

    expect(result).toEqual(
      format(`
        import memoize from 'memoize-one';

        function add(a: number, b: number) {
          return a + b;
        }

        const memoized = memoize(add);
      `),
    );
  });

  it('should wrap inline equality arrow functions', async () => {
    const result = await applyTransform(
      transformer,
      format(`
        import memoize from 'memoize-one';

        function add(a: number, b: number) {
          return a + b;
        }

        const memoized = memoize(add, (a, b) => {
          return a === b;
        });
      `),
      { parser: 'tsx' },
    );

    expect(result).toEqual(
      format(`
      import memoize from 'memoize-one';

      function add(a: number, b: number) {
        return a + b;
      }

      const memoized = memoize(add, (newArgs, lastArgs) => {
        if (newArgs.length !== lastArgs.length) {
          return false;
        }

        const __equalityFn = (a, b) => {
          return a === b;
        };

        return newArgs.every((newArg, index) => __equalityFn(newArg, lastArgs[index]));
      });
      `),
    );
  });

  it('should wrap inline equality function declarations', async () => {
    const result = await applyTransform(
      transformer,
      format(`
        import memoize from 'memoize-one';

        function add(a: number, b: number) {
          return a + b;
        }

        const memoized = memoize(add, function isEqual(a, b) {
          return a === b;
        });
      `),
      { parser: 'tsx' },
    );

    expect(result).toEqual(
      format(`
      import memoize from 'memoize-one';

      function add(a: number, b: number) {
        return a + b;
      }

      const memoized = memoize(add, (newArgs, lastArgs) => {
        if (newArgs.length !== lastArgs.length) {
          return false;
        }

        const __equalityFn = function isEqual(a, b) {
          return a === b;
        }

        return newArgs.every((newArg, index) => __equalityFn(newArg, lastArgs[index]));
      });
      `),
    );
  });

  it('should wrap function identifiers', async () => {
    const result = await applyTransform(
      transformer,
      format(`
        import memoize from 'memoize-one';
        import isEqual from 'something';

        function add(a: number, b: number) {
          return a + b;
        }

        const memoized = memoize(add, isEqual);
      `),
      { parser: 'tsx' },
    );

    expect(result).toEqual(
      format(`
      import memoize from 'memoize-one';
      import isEqual from 'something';

      function add(a: number, b: number) {
        return a + b;
      }

      const memoized = memoize(add, (newArgs, lastArgs) => {
        if (newArgs.length !== lastArgs.length) {
          return false;
        }

        const __equalityFn = isEqual;
        return newArgs.every((newArg, index) => __equalityFn(newArg, lastArgs[index]));
      });
      `),
    );
  });

  it('should add a comment when an unsupported equality fn is encountered', async () => {
    const result = await applyTransform(
      transformer,
      format(`
        import memoize from 'memoize-one';

        function add(a: number, b: number) {
          return a + b;
        }

        const memoized = memoize(add, {});
      `),
      { parser: 'tsx' },
    );

    expect(result).toEqual(
      format(`
        /* TODO: (@hypermod) Unable to migrate memoize-one custom equality function.
Expected a function or an identifier */
        import memoize from 'memoize-one';

        function add(a: number, b: number) {
          return a + b;
        }

        const memoized = memoize(add, {});
      `),
    );
  });
});
