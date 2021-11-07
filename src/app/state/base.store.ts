import { Store } from '@datorama/akita';

export class BaseStore<T> extends Store<T> {
  constructor(initialState: T) {
    super(initialState);
  }

  updateState(data: Partial<Omit<T, 'UIState'>>): void {
    this.update(state => ({
      ...state,
      ...data,
    }));
  }

  // @ts-ignore
  updateUIState(data: Partial<T['UIState']>): void {
    this.update((state) => ({
      ...state,
      UIState: {
        ...(state as any).UIState,
        ...data
      }
    }));
  }
}
