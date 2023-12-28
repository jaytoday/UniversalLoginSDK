import {Property} from 'reactive-properties';

export function waitFor<T>(predicate: (value: T) => boolean): (prop: Property<T>) => Promise<void> {
  return (source) => new Promise((resolve) => {
    if (predicate(source.get())) {
      resolve();
      return;
    }

    const unsubscribe = source.subscribe(() => {
      if (predicate(source.get())) {
        resolve();
        unsubscribe();
      }
    });
  });
}

export const waitForTrue = waitFor((x: boolean) => x);

export const waitForFalse = waitFor((x: boolean) => !x);
