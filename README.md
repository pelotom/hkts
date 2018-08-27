# HKTS - Higher-Kinded TypeScript [![Build Status](https://travis-ci.com/pelotom/hkts.svg?branch=master)](https://travis-ci.com/pelotom/hkts)

TypeScript [doesn't really support higher-kinded types yet](https://github.com/Microsoft/TypeScript/issues/1213), but various attempts have been made to simulate them (see ["Prior Work"](https://github.com/pelotom/hkts/blob/master/README.md#prior-work) at the bottom). This project is one such idea, which attempts to solve the problem via conditional types.

The idea is that a type which logically depends on a type constructor (rather than a simple type) just takes a regular type variable, and then uses the `$` operator to "apply" that variable to other types:

```ts
interface Functor<T> {
  map: <A, B>(f: (x: A) => B, t: $<T, [A]>) => $<T, [B]>;
}
```

Then, to make an instance of this "type class", we supply it with a version of our higher-kinded type which has been saturated with placeholders (`_`) representing type "variables":

```ts
type Maybe<A> = { tag: 'none' } | { tag: 'some'; value: A };
const MaybeF: Functor<Maybe<_>> = {
  map: (maybe, f) => maybe.tag === 'none' ? maybe : { tag: 'some'; value: f(maybe.value) },
};
```

A type application `$<T, S>` recursively walks the tree of type `T`, substituting any placeholders `_<N>` it finds with the corresponding argument type `S[N]`. `_` is shorthand for `_<0>`, and there are also placeholder aliases `_0 = _<0>`, `_1 = _<1>`, etc.

That's pretty much all there is to it! Take a look at [the tests](https://github.com/pelotom/hkts/blob/master/src/index.spec.ts) for more examples.

This is just a proof of concept at the moment; use at your own risk!

## Prior Work

Other notable attempts to solve this problem:

- https://medium.com/@gcanti/higher-kinded-types-in-typescript-static-and-fantasy-land-d41c361d0dbe
- https://github.com/SimonMeskens/TypeProps
