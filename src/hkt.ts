declare const index: unique symbol;

type _<N extends number = 0> = { [index]: N };

type $<T, S, N extends number = 0> =
  T extends _<N> ? S :
  T extends number | string | boolean | symbol ? T :
  // T extends (infer A)[] ? $<A, S, N>[] : <-- why doesn't this work?
  T extends (x: infer I) => infer O ? (x: $<I, S, N>) => $<O, S, N> :
  T extends object ? { [K in keyof T]: $<T[K], S, N> } : T;

interface Functor<F> {
  map: <A, B>(fa: $<F, A>, f: (a: A) => B) => $<F, B>;
}

interface Monad<M> {
  pure: <A>(a: A) => $<M, A>;
  bind: <A, B>(ma: $<M, A>, f: (a: A) => $<M, B>) => $<M, B>;
}

interface MonadLib<M> extends Monad<M>, Functor<M> {
  flatten: <A>(mma: $<M, $<M, A>>) => $<M, A>;
  // sequence, etc...
}

const Monad = <M>({ pure, bind }: Monad<M>): MonadLib<M> => ({
  pure,
  bind,
  map: (ma, f) => bind(ma, a => pure(f(a))),
  flatten: mma => bind(mma, ma => ma),
});

{ // Maybe
  type Maybe<A> = { tag: 'none' } | { tag: 'some'; value: A };
  const none: Maybe<never> = { tag: 'none' };
  const some = <A>(value: A): Maybe<A> => ({ tag: 'some', value });
  
  const { map, flatten } = Monad<Maybe<_>>({
    pure: some,
    bind: (ma, f) => {
      if (ma.tag === 'none') return none
      const mb = f(ma.value)
      if (mb.tag === 'none') return none
      return some(mb.value)
    },
  });
  
  // why do we need the `<number>` annotation? 🤨
  const result: Maybe<number> = map(flatten<number>(some(some(42))), n => n + 1);
}

{ // List
  type List<A> = { tag: 'nil' } | { tag: 'cons'; head: A; tail: List<A> };
  const nil: List<never> = { tag: 'nil' };
  const cons = <A>(head: A, tail: List<A>): List<A> => ({ tag: 'cons', head, tail });
  const concat = <A>(xs: List<A>, ys: List<A>): List<A> => xs.tag === 'nil' ? ys : concat(xs.tail, ys);
  const bindList = <A, B>(xs: List<A>, f: (a: A) => List<B>): List<B> =>  (xs.tag === 'nil' ? nil : concat(f(xs.head), bindList(xs.tail, f)))

  const { map, flatten } = Monad<List<_>>({
    pure: x => cons(x, nil),
    bind: bindList,
  });

  // why do we need the `<number>` annotation? 🤨
  const result: List<number> = map(flatten<number>(cons(cons(42, nil), nil)), n => n + 1);
}
