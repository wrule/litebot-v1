
export
async function retryer<ArgsType extends unknown[], ReturnType>(
  func: (...args: ArgsType) => ReturnType,
  args: ArgsType,
  retries = 2,
  retry_rule?: (error: any) => boolean,
) {
  let count = retries;
  const errors: any[] = [];
  while (count >= 0) {
    try {
      return await func(...args);
    } catch (error) {
      errors.push(error);
      if (!retry_rule || retry_rule(error)) {
        count--;
      } else {
        break;
      }
    }
  }
  throw errors;
}
