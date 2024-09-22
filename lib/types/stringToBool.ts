export const stringToBoolean = (stringValue: string): boolean | undefined => {
  switch (stringValue?.toLowerCase()?.trim()) {
    case "true":
    case "yes":
    case "1":
      return true;

    case "false":
    case "no":
    case "0":
      return false;

    case null:
    case undefined:
      return undefined;

    default:
      return JSON.parse(stringValue);
  }
};
