# HKTS - Higher-Kinded TypeScript [![Build Status](https://travis-ci.com/pelotom/hkts.svg?branch=master)](https://travis-ci.com/pelotom/hkts)

## Overview

TypeScript [doesn't really support higher-kinded types yet](https://github.com/Microsoft/TypeScript/issues/1213), but various attempts have been made to simulate them (see [related work](https://github.com/pelotom/hkts/blob/master/README.md#related-work) at the bottom). This project is one such idea, which attempts to solve the problem via conditional types.

The idea is that a type which logically depends on a type constructor (rather than a simple type) just takes a regular type variable, and then uses the `$` operator to "apply" that variable to other types. For example, here's how we would write the [`Functor` type class as defined by static-land](https://github.com/rpominov/static-land/blob/master/docs/spec.md#functor):

```ts
interface Functor<T> {
  map: <A, B>(f: (x: A) => B, t: $<T, [A]>) => $<T, [B]>;
}
```

Then, supposing we have a `Maybe` type

```ts
type Maybe<A> = { tag: 'none' } | { tag: 'some'; value: A };
const none: Maybe<never> = { tag: 'none' };
const some = <A>(value: A): Maybe<A> => ({ tag: 'some', value });
```

We can define a `Functor` instance for it like so:

```ts
const MaybeFunctor: Functor<Maybe<_>> = {
  map: (f, t) => t.tag === 'none' ? none : some(f(t.value)),
};
```

Notice that we are supplying the `Maybe` type constructor with the placeholder type `_`; this causes it to be come a fully saturated type so that we can pass it to `Functor`, but with all former occurrences of the type parameter clearly marked, so that they can be re-substituted using the `$` operator. A type application `$<T, S>` then recursively walks the tree of type `T`, substituting any placeholders `_<N>` it finds with the corresponding argument type `S[N]`. `_` is shorthand for `_<0>`, and there are also placeholder aliases `_0 = _<0>`, `_1 = _<1>`, etc.

Take a look at [the tests](https://github.com/pelotom/hkts/blob/master/src/index.spec.ts) for more examples.

## Type classes and instance factories

This package defines [a set of interfaces](https://github.com/pelotom/hkts/blob/master/src/static-land.ts) corresponding to the the type classes of the [static-land spec](https://github.com/rpominov/static-land), as well as factory functions for producing instances thereof. For example, there is a `Monad` interface as well as a `Monad` function. The function takes as arguments only the minimum data needed (`of` and `chain`) to produce an implementation of the full `Monad` interface (which includes other derived methods like `map`, `ap` and `join`). So again using the `Maybe` type above, we can construct a `Monad` instance like so:

```ts
const MaybeMonad = Monad<Maybe<_>>({
  of: some,
  chain: (f, t) => t.tag === 'none' ? none : f(t.value),
});

// Use the `map` method, which we didn't have to define:
expect(MaybeMonad.map(n => n + 1, some(42))).toBe(some(43));
```

## Abstracting over kinds of higher arity

As alluded to above, the type `S` of `$<T, S>` is a tuple of types `[S0, S1, ..., SN]` to be substituted for the corresponding placeholders `_0`, `_1`, ..., `_<N>`. This allows us to define for example `Bifunctor` in a straightforward way:

```ts
interface Bifunctor<T> {
  bimap: <A, B, C, D>(f: (x: A) => B, g: (x: C) => D, t: $<T, [A, C]>) => $<T, [B, D]>;
  // ...
}
```

and a `Bifunctor` instance for `Either` using placeholders `_0` and `_1`:

```ts
type EitherBifunctor: Bifunctor<Either<_0, _1>> = {
  bimap: (f, g, t) => (t.tag === 'left' ? left(f(t.left)) : right(g(t.right))),
};
```

## Fixing type parameters

Some trickiness arises when we want to ignore one or more of the parameters of a type constructor for the purpose of making it an instance of a type class. For example we can make a `Monad` out of `Either` by ignoring its first parameter and using the second parameter as the "hole" of the monad. The way to do this is to make a polymorphic instance creation function which can produce a `Monad` instance _for any given left type `L`_:

```ts
const RightMonad = <L>() => Monad<Either<L, _>>({
  pure: right,
  bind: (ma, f) => (ma.tag === 'left' ? ma : f(ma.right)),
});
```

Unfortunately here we run into a problem, because the type application `$` will get stuck on our type parameter `L` (see [known limitations](https://github.com/pelotom/hkts/blob/master/README.md#related-work)). Fortunately the workaround is pretty simple: we mark any extraneous type parameters with the `Fixed` operator, like so:

```ts
const RightMonad = <L>() => Monad<Either<Fixed<L>, _>>({
  pure: right,
  bind: (ma, f) => (ma.tag === 'left' ? ma : f(ma.right)),
});
```

When the substitution encounters a `Fixed<T>`, it will not recurse into it, but simply evaluate to `T`.

## Known limitations

The type application operator `$` is able to transform most types correctly, including functions, however there are a few edge cases:
- It can only be applied to fully-satured types, i.e. containing no (real) type parameters, only placeholders. This is because `$` has no way of knowing whether a type parameter will ultimately be instantiated as a placeholder (even though it never should be). Use the `Fixed` type operator as described above to protect type parameters.
- Polymorphic functions will get nerfed. For example:
  ```ts
  type Id = <A>(x: A) => A
  type NerfedId = $<Id, []>;
  // type NerfedId = (x_0: {}) => {}
  ```
  Not what you wanted! Unfortunately TypeScript's conditional types don't currently allow analyzing and reconstructing the type parameters of a function (https://github.com/Microsoft/TypeScript/issues/5453 might solve that). You can protect polymorphic types with `Fixed` as well, although then they can't contain placeholders, so that's probably not of much use to you.
- Tuples `[A, B, ...]` are transformed correctly up to size 10 (though we can add arbitrarily many more as needed), after which they will be transformed into an array `(A | B | ...)[]`. Correspondingly, functions of arity <= 10 are supported.
- The `join` method of `Monad` [must be supplied a type parameter](https://github.com/pelotom/hkts/blob/5ba4734bef74e9c2b8a10a75cb1de9ce230bde37/src/index.spec.ts#L23) for some reason... I've filed https://github.com/Microsoft/TypeScript/issues/26807 for this. The good news is it's still safe; you can't provide a _wrong_ type argument without getting an error.

## Related work

Other notable attempts to solve this problem:

- https://medium.com/@gcanti/higher-kinded-types-in-typescript-static-and-fantasy-land-d41c361d0dbe
- https://github.com/SimonMeskens/TypeProps
