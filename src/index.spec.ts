import { Bifunctor, Monad, _, _1, _0 } from '.';

it('array', () => {
  const { map, join } = Monad<_[]>({
    pure: x => [x],
    bind: (xs, f) => xs.map(f).reduce((xs, ys) => xs.concat(ys), []),
  });

  const result = map(join<number>([[42]]), n => n + 1);
  expect(result).toEqual([43]);
});

it('maybe', () => {
  type Maybe<A> = { tag: 'none' } | { tag: 'some'; value: A };
  const none: Maybe<never> = { tag: 'none' };
  const some = <A>(value: A): Maybe<A> => ({ tag: 'some', value });

  const { map, join } = Monad<Maybe<_>>({
    pure: some,
    bind: (ma, f) => (ma.tag === 'some' ? f(ma.value) : ma),
  });

  const result = map(join<number>(some(some(42))), n => n + 1);
  expect(result).toEqual(some(43));
});

it('list', () => {
  type List<A> = { tag: 'nil' } | { tag: 'cons'; head: A; tail: List<A> };
  const nil: List<never> = { tag: 'nil' };
  const cons = <A>(head: A, tail: List<A> = nil): List<A> => ({ tag: 'cons', head, tail });
  const concat = <A>(xs: List<A>, ys: List<A>): List<A> =>
    xs.tag === 'nil' ? ys : cons(xs.head, concat(xs.tail, ys));
  const bindList = <A, B>(xs: List<A>, f: (a: A) => List<B>): List<B> =>
    xs.tag === 'nil' ? nil : concat(f(xs.head), bindList(xs.tail, f));

  const { map, join } = Monad<List<_>>({
    pure: x => cons(x, nil),
    bind: bindList,
  });

  const result = map(join<number>(cons(cons(42))), n => n + 1);
  expect(result).toEqual(cons(43));
});

it('either', () => {
  type Either<A, B> = { tag: 'left'; left: A } | { tag: 'right'; right: B };
  const left = <A>(left: A): Either<A, never> => ({ tag: 'left', left });
  const right = <B>(right: B): Either<never, B> => ({ tag: 'right', right });

  const { bimap } = Bifunctor<Either<_0, _1>>({
    bimap: (fab, f, g) => (fab.tag === 'left' ? left(f(fab.left)) : right(g(fab.right))),
  });

  const l = (x: number): boolean => !(x % 2);
  const r = (y: boolean): string => String(y);

  const input1: Either<number, boolean> = left(2);
  const result1 = bimap(input1, l, r);
  expect(result1).toEqual(left(true));

  const input2: Either<number, boolean> = right(true);
  const result2 = bimap(input2, l, r);
  expect(result2).toEqual(right('true'));
});
