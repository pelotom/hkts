# HKTS - Higher-Kinded Types in TypeScript

TypeScript [doesn't really support higher-kinded types yet](https://github.com/Microsoft/TypeScript/issues/1213), but it's possible to simulate them--[Giulio Canti](https://github.com/gcanti) [has demonstrated one such approach](https://medium.com/@gcanti/higher-kinded-types-in-typescript-static-and-fantasy-land-d41c361d0dbe). This project is another idea, which attempts to solve the problem via conditional types.

The idea is that a type which logically depends on a type constructor (rather than a simple type) just takes a regular type variable, and then uses the `$` operator to "apply" that variable to other types:

```ts
interface Functor<F> {
  map: <A, B>(fa: $<F, A>, f: (a: A) => B) => $<F, B>;
}
```

Then, to make an instance of this "type class", we supply it with a version of our higher-kinded type which has been saturated with type "variables" (`_`):

```ts
type Maybe<A> = { tag: 'none' } | { tag: 'some'; value: A };
const MaybeF: Functor<Maybe<_>> = {
  map: (maybe, f) => maybe.tag === 'none' ? maybe : { tag: 'some'; value: f(maybe.value) },
};
```

The `$` operator recursively walks the tree of the first type passed to it, substituting `_`s wherever it finds them with the second type passed to it. That's all there is to it! Take a look at [the tests](https://github.com/pelotom/hkts/blob/master/src/index.spec.ts) for more examples.

This is just a proof of concept at the moment; use at your own risk!
