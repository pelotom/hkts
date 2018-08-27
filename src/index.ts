declare const index: unique symbol;

/**
 * Placeholder representing an indexed type variable.
 */
export interface _<N extends number = 0> {
  [index]: N;
}
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

declare const fixed: unique symbol;

/**
 * Marks a type to be ignored by the application operator `$`. This is used to protect
 * bound type parameters.
 */
export interface Fixed<T> {
  [fixed]: T;
}

/**
 * Type application (simultaneously substitutes all placeholders within the target type)
 */
// prettier-ignore
export type $<T, S extends any[]> = (
  T extends Fixed<infer U> ? { [indirect]: U } :
  T extends _<infer N> ? { [indirect]: S[N] } :
  T extends undefined | null | boolean | string | number ? { [indirect]: T } :
  T extends (infer A)[] & { length: infer L } ? {
    [indirect]: L extends keyof TupleTable
      ? TupleTable<T, S>[L]
      : $<A, S>[]
  } :
  T extends (...x: infer I) => infer O ? { [indirect]: (...x: $<I, S>) => $<O, S> } :
  T extends object ? { [indirect]: { [K in keyof T]: $<T[K], S> } } :
  { [indirect]: T }
)[typeof indirect];

/**
 * Used as a level of indirection to avoid circularity errors.
 */
declare const indirect: unique symbol;

/**
 * Allows looking up the type for a tuple based on its `length`, instead of trying
 * each possibility one by one in a single long conditional.
 */
// prettier-ignore
type TupleTable<T extends any[] = any, S extends any[] = any> = {
  0: [];
  1: T extends [
      infer A0
    ] ? [
      $<A0, S>
    ] : never
  2: T extends [
      infer A0, infer A1
    ] ? [
      $<A0, S>, $<A1, S>
    ] : never
  3: T extends [
      infer A0, infer A1, infer A2
    ] ? [
      $<A0, S>, $<A1, S>, $<A2, S>
    ] : never
  4: T extends [
      infer A0, infer A1, infer A2, infer A3
    ] ? [
      $<A0, S>, $<A1, S>, $<A2, S>, $<A3, S>
    ] : never
  5: T extends [
      infer A0, infer A1, infer A2, infer A3, infer A4
    ] ? [
      $<A0, S>, $<A1, S>, $<A2, S>, $<A3, S>, $<A4, S>
    ] : never
  6: T extends [
      infer A0, infer A1, infer A2, infer A3, infer A4, infer A5
    ] ? [
      $<A0, S>, $<A1, S>, $<A2, S>, $<A3, S>, $<A4, S>, $<A5, S>
    ] : never
  7: T extends [
      infer A0, infer A1, infer A2, infer A3, infer A4, infer A5, infer A6
    ] ? [
      $<A0, S>, $<A1, S>, $<A2, S>, $<A3, S>, $<A4, S>, $<A5, S>, $<A6, S>
    ] : never
  8: T extends [
      infer A0, infer A1, infer A2, infer A3, infer A4, infer A5, infer A6, infer A7
    ] ? [
      $<A0, S>, $<A1, S>, $<A2, S>, $<A3, S>, $<A4, S>, $<A5, S>, $<A6, S>, $<A7, S>
    ] : never
  9: T extends [
      infer A0, infer A1, infer A2, infer A3, infer A4, infer A5, infer A6, infer A7, infer A8
    ] ? [
      $<A0, S>, $<A1, S>, $<A2, S>, $<A3, S>, $<A4, S>, $<A5, S>, $<A6, S>, $<A7, S>, $<A8, S>
    ] : never
  10: T extends [
      infer A0, infer A1, infer A2, infer A3, infer A4, infer A5, infer A6, infer A7, infer A8, infer A9
    ] ? [
      $<A0, S>, $<A1, S>, $<A2, S>, $<A3, S>, $<A4, S>, $<A5, S>, $<A6, S>, $<A7, S>, $<A8, S>, $<A9, S>
    ] : never
}

export * from './static-land';
