import { Transform } from "class-transformer";
import {
  IsEmail,
  Matches,
  MaxLength,
  MinLength
} from "class-validator";
import { ValidationMessages } from "../../constants/error-messages";

export class RegisterRequestDto {
  @MinLength(5)
  @MaxLength(15)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: ValidationMessages.USERNAME_INVALID_CHARS,
  })
  readonly username: string;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  readonly email: string;

  @MinLength(8, { message: ValidationMessages.PASSWORD_TOO_SHORT(8) })
  @MaxLength(64, { message: ValidationMessages.PASSWORD_TOO_LONG(64) })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: ValidationMessages.PASSWORD_TOO_WEAK,
  })
  readonly password: string;

  @MinLength(8, { message: ValidationMessages.PASSWORD_TOO_SHORT(8) })
  @MaxLength(64, { message: ValidationMessages.PASSWORD_TOO_LONG(64) })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: ValidationMessages.PASSWORD_TOO_WEAK,
  })
  readonly repeatPassword: string;
}