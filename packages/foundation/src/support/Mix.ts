// eslint-disable-next-line @typescript-eslint/ban-types
type Constructor<T = {}> = new (...args: any[]) => T;

export interface MixinBuilder<TBase> {
    with<T1>(m1: (b: TBase) => T1): T1;
    with<T1, T2>(m1: (b: TBase) => T1, m2: (b: T1) => T2): T2;
    with<T1, T2, T3>(m1: (b: TBase) => T1, m2: (b: T1) => T2, m3: (b: T2) => T3): T3;
    with<T1, T2, T3, T4>(m1: (b: TBase) => T1, m2: (b: T1) => T2, m3: (b: T2) => T3, m4: (b: T3) => T4): T4;
    with<T1, T2, T3, T4, T5>(
        m1: (b: TBase) => T1, 
        m2: (b: T1) => T2, 
        m3: (b: T2) => T3, 
        m4: (b: T3) => T4, 
        m5: (b: T4) => T5
    ): T5;
    with(...mixins: Array<(b: any) => any>): any;
}

/**
 * A helper for applying multiple mixins cleanly.
 * 
 * Usage:
 * class Board extends mix(Model).with(withSoftDeletes, withUUID) { ... }
 */
export function mix<TBase extends Constructor | any>(Base: TBase): MixinBuilder<TBase> {
    return {
        with(...mixins: Array<(b: any) => any>): any {
            return mixins.reduce((currentClass, mixin) => mixin(currentClass), Base);
        }
    };
}

