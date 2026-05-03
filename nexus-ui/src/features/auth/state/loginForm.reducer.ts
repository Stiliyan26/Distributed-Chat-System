import type { LoginFormAction, LoginFormState } from "./loginForm.types";
import { LOGIN_ACTIONS } from "./loginForm.types";

export const loginFormInitialState: LoginFormState = {
  email: "",
  password: "",
  showPassword: false,
  error: "",
  loading: false,
};

export function loginFormReducer(
  state: LoginFormState,
  action: LoginFormAction,
): LoginFormState {
  switch (action.type) {
    case LOGIN_ACTIONS.SET_EMAIL:
      return { ...state, email: action.payload };
    case LOGIN_ACTIONS.SET_PASSWORD:
      return { ...state, password: action.payload };
    case LOGIN_ACTIONS.TOGGLE_PASSWORD:
      return { ...state, showPassword: !state.showPassword };
    case LOGIN_ACTIONS.START_SUBMIT:
      return { ...state, error: "", loading: true };
    case LOGIN_ACTIONS.FAIL_SUBMIT:
      return { ...state, error: action.payload };
    case LOGIN_ACTIONS.END_SUBMIT:
      return { ...state, loading: false };
    default:
      return state;
  }
}
