# HKTS - Higher-Kinded TypeScript [![Build Status](https://travis-ci.com/pelotom/hkts.svg?branch=master)](https://travis-ci.com/pelotom/hkts)

## Overview

TypeScript [doesn't directly support higher-kinded types yet](https://github.com/Microsoft/TypeScript/issues/1213), but various attempts have been made to simulate them (see [related work](https://github.com/pelotom/hkts/blob/master/README.md#related-work) at the bottom). This project presents a new, greatly simplified approach to encoding HKTs using the power of conditional types.

The idea is that, although we can't truly abstract over a type constructor `type T<A> = ...`, we _can_ abstract over the result `T<_>` of applying it to a special placeholder type `_`. Then, if we can somehow substitute all instances of `_` within a type, we effectively have the ability to "apply" `T` at arbitrary types. That is, we can abstract over `T`! And it turns out we can define a substitution operator `$<T, S>` which does just that.

Here's how we would use `$` to define the [static-land's `Functor` type class](https://github.com/rpominov/static-land/blob/master/docs/spec.md#functor):

```ts
interface Functor<T> {
  map: <A, B>(f: (x: A) => B, t: $<T, [A]>) => $<T, [B]>;
}
```

Then, supposing we have a `Maybe` type constructor

```ts
type Maybe<A> = { tag: 'none' } | { tag: 'some'; value: A };
const none: Maybe<never> = { tag: 'none' };
const some = <A>(value: A): Maybe<A> => ({ tag: 'some', value });
```

we can define a `Functor` instance for it like so, using the placeholder type `_`:

```ts
const MaybeFunctor: Functor<Maybe<_>> = {
  map: (f, maybe) => maybe.tag === 'none' ? none : some(f(maybe.value)),
};

// It works!
expect(MaybeFunctor.map(n => n + 1, some(42))).toEqual(some(43));
```

## Type classes and instance factories

This package defines [a set of interfaces](https://github.com/pelotom/hkts/blob/master/src/static-land.ts) corresponding to the the type classes of the [static-land spec](https://github.com/rpominov/static-land), as well as factory functions for producing instances thereof. For example, there is a `Monad` interface as well as a `Monad` function. The function takes as arguments only the minimum data (`of` and `chain`) needed to produce an implementation of the full `Monad` interface (which includes other derived methods like `map`, `ap` and `join`). So again using the `Maybe` type above, we can construct a `Monad` instance like so:

```ts
const MaybeMonad = Monad<Maybe<_>>({
  of: some,
  chain: (f, maybe) => maybe.tag === 'none' ? none : f(maybe.value),
});

// Use the `map` method, which we didn't have to define:
expect(MaybeMonad.map(n => n + 1, some(42))).toBe(some(43));
```

## Abstracting over kinds of higher arity

You may have noticed in the above example that `$` takes an array of substitution types as its second parameter. There are also placeholders `_0` (an alias for `_`), `_1`, `_2`, ..., `_<N>`. `$<T, S>` simultaneously replaces `_0` with `S[0]`, `_1` with `S[1]`, and so on, throughout `T`. This allows us to define, for example, `Bifunctor`, which abstracts over a type constructor of kind `(*, *) -> *`:

```ts
interface Bifunctor<T> {
  bimap: <A, B, C, D>(f: (x: A) => B, g: (x: C) => D, t: $<T, [A, C]>) => $<T, [B, D]>;
  // ...
}
```

Then given an `Either` type constructor

```ts
type Either<A, B> = { tag: 'left'; left: A } | { tag: 'right'; right: B };
const left = <A>(left: A): Either<A, never> => ({ tag: 'left', left });
const right = <B>(right: B): Either<never, B> => ({ tag: 'right', right });
```

a `Bifunctor` instance for it looks like

```ts
type EitherBifunctor: Bifunctor<Either<_0, _1>> = {
  bimap: (f, g, either) => (either.tag === 'left' ? left(f(either.left)) : right(g(either.right))),
};
```

## Fixing type parameters

Suppose we want to ignore one or more of the parameters of a type constructor for the purpose of making it an instance of a type class. For example we can make a `Monad` out of `Either` by ignoring its first parameter and using the second parameter as the "hole" of the monad. The way to do this is to make a polymorphic instance creation function which can produce a `Monad` instance _for any given left type `L`_:

```ts
const RightMonad = <L>() => Monad<Either<L, _>>({
  of: right,
  chain: (f, either) => either.tag === 'left' ? either : f(either.right),
});
```

## Known limitations

The type application operator `$` is able to transform most types correctly, including functions, however there are a few edge cases:
- Polymorphic functions will get nerfed. For example:
  ```ts
  type Id = <A>(x: A) => A
  type NerfedId = $<Id, []>;
  // type NerfedId = (x_0: {}) => {}
  ```
  Not what you wanted! Unfortunately TypeScript's conditional types don't currently allow analyzing and reconstructing the type parameters of a function ([this feature](https://github.com/Microsoft/TypeScript/issues/5453) might solve that).
- Tuples `[A, B, ...]` are transformed correctly up to size 10 (though we can add arbitrarily many more as needed), after which they will be transformed into an array `(A | B | ...)[]`. Correspondingly, functions of arity <= 10 are supported.
- In some cases the `join` method of `Monad` [must be supplied a type parameter](https://github.com/pelotom/hkts/blob/5ba4734bef74e9c2b8a10a75cb1de9ce230bde37/src/index.spec.ts#L23)... I've filed [an issue about this](https://github.com/Microsoft/TypeScript/issues/26807). The good news is it's still safe; you can't provide a _wrong_ type argument without getting an error.

## Related work

Other notable attempts to solve this problem:

- https://medium.com/@gcanti/higher-kinded-types-in-typescript-static-and-fantasy-land-d41c361d0dbe
- https://github.com/SimonMeskens/TypeProps
