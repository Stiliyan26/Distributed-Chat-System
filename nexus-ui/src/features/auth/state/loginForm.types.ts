export interface LoginFormState {
  email: string;
  password: string;
  showPassword: boolean;
  error: string;
  loading: boolean;
}

export const LOGIN_ACTIONS = {
  SET_EMAIL: "setEmail",
  SET_PASSWORD: "setPassword",
  TOGGLE_PASSWORD: "togglePassword",
  START_SUBMIT: "startSubmit",
  FAIL_SUBMIT: "failSubmit",
  END_SUBMIT: "endSubmit",
} as const;

export type LoginFormAction =
  | { type: typeof LOGIN_ACTIONS.SET_EMAIL; payload: string }
  | { type: typeof LOGIN_ACTIONS.SET_PASSWORD; payload: string }
  | { type: typeof LOGIN_ACTIONS.TOGGLE_PASSWORD }
  | { type: typeof LOGIN_ACTIONS.START_SUBMIT }
  | { type: typeof LOGIN_ACTIONS.FAIL_SUBMIT; payload: string }
  | { type: typeof LOGIN_ACTIONS.END_SUBMIT };
