import { Bifunctor, Fixed, Monad, _, _0, _1 } from '.';

it('array', () => {
  const { map, join } = Monad<_[]>({
    of: x => [x],
    chain: (f, xs) => xs.map(f).reduce((xs, ys) => xs.concat(ys), []),
  });

  const result = map(n => n + 1, join([[42]]));
  expect(result).toEqual([43]);
});

it('maybe', () => {
  type Maybe<A> = { tag: 'none' } | { tag: 'some'; value: A };
  const none: Maybe<never> = { tag: 'none' };
  const some = <A>(value: A): Maybe<A> => ({ tag: 'some', value });

  const { map, join } = Monad<Maybe<_>>({
    of: some,
    chain: (f, ma) => (ma.tag === 'some' ? f(ma.value) : ma),
  });

  const result = map(n => n + 1, join<number>(some(some(42))));
  expect(result).toEqual(some(43));
});

it('list', () => {
  type List<A> = { tag: 'nil' } | { tag: 'cons'; head: A; tail: List<A> };
  const nil: List<never> = { tag: 'nil' };
  const cons = <A>(head: A, tail: List<A> = nil): List<A> => ({ tag: 'cons', head, tail });
  const concat = <A>(xs: List<A>, ys: List<A>): List<A> =>
    xs.tag === 'nil' ? ys : cons(xs.head, concat(xs.tail, ys));
  const chainList = <A, B>(f: (a: A) => List<B>, xs: List<A>): List<B> =>
    xs.tag === 'nil' ? nil : concat(f(xs.head), chainList(f, xs.tail));

  const { map, join } = Monad<List<_>>({
    of: x => cons(x, nil),
    chain: chainList,
  });

  const result = map(n => n + 1, join<number>(cons(cons(42))));
  expect(result).toEqual(cons(43));
});

describe('either', () => {
  type Either<A, B> = { tag: 'left'; left: A } | { tag: 'right'; right: B };
  const left = <A>(left: A): Either<A, never> => ({ tag: 'left', left });
  const right = <B>(right: B): Either<never, B> => ({ tag: 'right', right });

  it('bifunctor', () => {
    const { bimap, first, second } = Bifunctor<Either<_0, _1>>({
      bimap: (f, g, fab) => (fab.tag === 'left' ? left(f(fab.left)) : right(g(fab.right))),
    });

    const l = (x: number): boolean => !(x % 2);
    const r = (y: boolean): string => String(y);

    const input1: Either<number, boolean> = left(2);
    const result1 = bimap(l, r, input1);
    expect(result1).toEqual(left(true));

    const input2: Either<number, boolean> = right(true);
    const result2 = bimap(l, r, input2);
    expect(result2).toEqual(right('true'));

    expect(first(result2).map(x => !x, result2)).toEqual(right('true'));
    expect(second(result2).map(x => x.length, result2)).toEqual(right(4));
  });

  it('monad', () => {
    const RightMonad = <L>() =>
      Monad<Either<L, _>>({
        of: right,
        chain: (f, ma) => (ma.tag === 'left' ? ma : f(ma.right)),
      });

    const either = right(42);
    const result = RightMonad().map(n => n + 1, either);
    expect(result).toEqual(right(43));
  });
});
