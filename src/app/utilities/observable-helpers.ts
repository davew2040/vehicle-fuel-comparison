import { catchError, from, of, OperatorFunction, startWith, switchMap } from "rxjs";

type AsyncFn<I, O> = (input: I) => Promise<O>;

export function withWaitingAsync<I, O>(
  asyncFn: AsyncFn<I, O>,
  waitingValue: O,
  errorValue: O
): OperatorFunction<I, O> {
  return switchMap((input: I) =>
    from(asyncFn(input))
    .pipe(
      startWith(waitingValue),
      catchError(() => of(errorValue))
    )
  );
}