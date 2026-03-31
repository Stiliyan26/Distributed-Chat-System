import { Transform } from "class-transformer";
import { IsEmail, Matches, MaxLength, MinLength } from "class-validator";
import { ValidationMessages } from "../../../constants/auth.constants";
import { IsStrongPassword } from "../../decorators/is-strong-password.decorator";

export class RegisterUserRequestDto {
  @MinLength(5)
  @MaxLength(15)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: ValidationMessages.USERNAME_INVALID_CHARS,
  })
  readonly username: string;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  readonly email: string;

  @IsStrongPassword()
  readonly password: string;

  @IsStrongPassword()
  readonly repeatPassword: string;
}