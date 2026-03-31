import { Transform } from "class-transformer";
import {
  IsEmail
} from "class-validator";

import { IsStrongPassword } from "../../decorators/is-strong-password.decorator";

export class LoginUserRequestDto {

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  readonly email: string;

  @IsStrongPassword()
  readonly password: string;
}