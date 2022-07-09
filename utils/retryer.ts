
export
interface IErrorDetail {
  error: any;
  call_time: number;
  error_time: number;
}

export
async function retryer<ArgsType extends unknown[], ReturnType>(
  func: (...args: ArgsType) => ReturnType,
  args: ArgsType,
  retries = 2,
  retry_rule?: (error: any) => boolean,
) {
  let count = retries;
  const errors: IErrorDetail[] = [];
  while (count >= 0) {
    let call_time = 0;
    try {
      call_time = Number(new Date());
      return await func(...args);
    } catch (error) {
      errors.push({
        call_time,
        error_time: Number(new Date()),
        error,
      });
      if (!retry_rule || retry_rule(error)) {
        count--;
      } else {
        break;
      }
    }
  }
  throw errors;
}
