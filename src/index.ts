declare const index: unique symbol;

// Placeholders representing indexed type variables
export type _<N extends number = 0> = { [index]: N };
export type _0 = _<0>;
export type _1 = _<1>;
export type _2 = _<2>;
export type _3 = _<3>;
export type _4 = _<4>;
export type _5 = _<5>;
export type _6 = _<6>;
export type _7 = _<7>;
export type _8 = _<8>;
export type _9 = _<9>;

declare const ignore: unique symbol;
export type Ignore<T> = { [ignore]: T };

// Type application (simultaneously substitutes all placeholders within the target type)
// prettier-ignore
export type $<T, S extends any[]> =
  T extends Ignore<infer U> ? U :
  T extends _<infer N> ? S[N] :
  T extends undefined | null | boolean | string | number ? T :
  T extends Array<infer A> ? $Array<A, S> :
  T extends (...x: infer I) => infer O ? (...x: $<I, S>) => $<O, S> :
  T extends object ? { [K in keyof T]: $<T[K], S> } :
  T;

export interface $Array<T, S extends any[]> extends Array<$<T, S>> {}

// Some familiar type classes...

export interface Functor<F> {
  map: <A, B>(fa: $<F, [A]>, f: (a: A) => B) => $<F, [B]>;
}

export interface Monad<M> {
  pure: <A>(a: A) => $<M, [A]>;
  bind: <A, B>(ma: $<M, [A]>, f: (a: A) => $<M, [B]>) => $<M, [B]>;
}

export interface MonadLib<M> extends Monad<M>, Functor<M> {
  join: <A>(mma: $<M, [$<M, [A]>]>) => $<M, [A]>;
  // sequence, etc...
}

export const Monad = <M>({ pure, bind }: Monad<M>): MonadLib<M> => ({
  pure,
  bind,
  map: (ma, f) => bind(ma, a => pure(f(a))),
  join: mma => bind(mma, ma => ma),
});

export interface Bifunctor<F> {
  bimap: <A, B, C, D>(fab: $<F, [A, B]>, f: (a: A) => C, g: (b: B) => D) => $<F, [C, D]>;
}

export interface BifunctorLib<F> extends Bifunctor<F> {
  first: <A, B, C>(fab: $<F, [A, B]>, f: (a: A) => C) => $<F, [C, B]>;
  second: <A, B, D>(fab: $<F, [A, B]>, g: (b: B) => D) => $<F, [A, D]>;
}

const id = <A>(a: A): A => a;

export const Bifunctor = <F>({ bimap }: Bifunctor<F>): BifunctorLib<F> => ({
  bimap,
  first: (fab, f) => bimap(fab, f, id),
  second: (fab, g) => bimap(fab, id, g),
});
