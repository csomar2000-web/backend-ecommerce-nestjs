import { registerDecorator, ValidationOptions } from 'class-validator';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSPHRASE_MIN_LENGTH = 16;

export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export function isStrongPassword(value: string): boolean {
  if (!value) return false;

  if (value.length >= PASSPHRASE_MIN_LENGTH) {
    return true;
  }

  return (
    value.length >= PASSWORD_MIN_LENGTH &&
    PASSWORD_COMPLEXITY_REGEX.test(value)
  );
}

export function StrongPassword(options?: ValidationOptions) {
  return function (target: any, propertyKey: string) {
    registerDecorator({
      name: 'StrongPassword',
      target: target.constructor,
      propertyName: propertyKey,
      options: {
        message:
          `Password must be at least ${PASSWORD_MIN_LENGTH} characters with upper, lower, number, and special character ` +
          `or at least ${PASSPHRASE_MIN_LENGTH} characters long`,
        ...options,
      },
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isStrongPassword(value);
        },
      },
    });
  };
}
