import { Monad, _ } from '.';

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
    bind: (ma, f) => {
      if (ma.tag === 'none') return none;
      const mb = f(ma.value);
      if (mb.tag === 'none') return none;
      return some(mb.value);
    },
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
