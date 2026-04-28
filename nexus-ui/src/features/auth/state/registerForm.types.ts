export type Strength = "WEAK" | "FAIR" | "STRONG" | "VERY STRONG";

export interface RegisterFormState {
  username: string;
  email: string;
  password: string;
  confirm: string;
  error: string;
  loading: boolean;
}

/** Discriminant values for the register form reducer (single source of truth). */
export const REGISTER_ACTIONS = {
  SET_USERNAME: "setUsername",
  SET_EMAIL: "setEmail",
  SET_PASSWORD: "setPassword",
  SET_CONFIRM: "setConfirm",
  START_SUBMIT: "startSubmit",
  FAIL_SUBMIT: "failSubmit",
  END_SUBMIT: "endSubmit",
} as const;

export type RegisterFormAction =
  | { type: typeof REGISTER_ACTIONS.SET_USERNAME; payload: string }
  | { type: typeof REGISTER_ACTIONS.SET_EMAIL; payload: string }
  | { type: typeof REGISTER_ACTIONS.SET_PASSWORD; payload: string }
  | { type: typeof REGISTER_ACTIONS.SET_CONFIRM; payload: string }
  | { type: typeof REGISTER_ACTIONS.START_SUBMIT }
  | { type: typeof REGISTER_ACTIONS.FAIL_SUBMIT; payload: string }
  | { type: typeof REGISTER_ACTIONS.END_SUBMIT };
