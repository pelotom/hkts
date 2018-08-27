import { $ } from '.';

export interface Setoid<T> {
  equals: (x: T, y: T) => boolean;
}

export interface Ord<T> extends Setoid<T> {
  lte: (x: T, y: T) => boolean;
}

export interface Semigroup<T> {
  concat: (x: T, y: T) => T;
}

export interface Monoid<T> extends Semigroup<T> {
  empty: () => T;
}

export interface Group<T> extends Monoid<T> {
  invert: (x: T) => T;
}

export interface Semigroupoid<T> {
  compose: <I, J, K>(tij: $<T, [I, J]>, tjk: $<T, [J, K]>) => $<T, [I, K]>;
}

export interface Category<T> extends Semigroupoid<T> {
  id: <I, J>() => $<T, [I, J]>;
}

export interface Filterable<T> {
  filter: <A>(pred: (x: A) => boolean, ta: $<T, [A]>) => $<T, [A]>;
}

export interface Functor<T> {
  map: <A, B>(f: (x: A) => B, ta: $<T, [A]>) => $<T, [B]>;
}

export interface Bifunctor<T> {
  bimap: <A, B, C, D>(f: (x: A) => B, g: (x: C) => D, t: $<T, [A, C]>) => $<T, [B, D]>;
}

export interface Contravariant<T> {
  contramap: <A, B>(f: (x: A) => B, t: $<T, [B]>) => $<T, [A]>;
}

export interface Profunctor<T> {
  promap: <A, B, C, D>(f: (x: A) => B, g: (x: C) => D, t: $<T, [B, C]>) => $<T, [A, D]>;
}

export interface Apply<T> extends Functor<T> {
  ap: <A, B>(tf: $<T, [(x: A) => B]>, ta: $<T, [A]>) => $<T, [B]>;
}

export interface Applicative<T> extends Apply<T> {
  of: <A>(x: A) => $<T, [A]>;
}

export interface Alt<T> extends Functor<T> {
  alt: <A>(x: $<T, [A]>, y: $<T, [A]>) => $<T, [A]>;
}

export interface Plus<T> extends Alt<T> {
  zero: <A>() => $<T, [A]>;
}

export interface Alternative<T> extends Applicative<T>, Plus<T> {}

export interface Chain<T> extends Apply<T> {
  chain: <A, B>(f: (x: A) => $<T, [B]>, t: $<T, [A]>) => $<T, [B]>;
}

export interface Monad<T> extends Applicative<T>, Chain<T> {}

export interface Foldable<T> {
  reduce: <A, B>(f: (x: A, y: B) => A, x: A, u: $<T, [B]>) => A;
}

export interface Extend<T> extends Functor<T> {
  extend: <A, B>(f: (t: $<T, [A]>) => B, t: $<T, [A]>) => $<T, [B]>;
}

export interface Comonad<T> extends Extend<T> {
  extract: <a>(t: $<T, [a]>) => a;
}

export interface Traversable<T> extends Functor<T>, Foldable<T> {
  traverse: <U, A, B>(a: Applicative<U>, f: (x: A) => $<U, [B]>, t: $<T, [A]>) => $<U, [$<T, [B]>]>;
}
