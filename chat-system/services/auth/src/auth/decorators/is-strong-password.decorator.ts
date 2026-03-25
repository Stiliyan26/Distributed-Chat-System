import { applyDecorators } from '@nestjs/common';
import { Matches, MaxLength, MinLength } from 'class-validator';
import { ValidationMessages } from '../../constants/auth.constants';

export function IsStrongPassword() {
  return applyDecorators(
    MinLength(8, { message: ValidationMessages.PASSWORD_TOO_SHORT(8) }),
    MaxLength(64, { message: ValidationMessages.PASSWORD_TOO_LONG(64) }),
    Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
      message: ValidationMessages.PASSWORD_TOO_WEAK,
    })
  );
}
