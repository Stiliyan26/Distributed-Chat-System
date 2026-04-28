import type { RegisterFormAction, RegisterFormState } from "./registerForm.types";
import { REGISTER_ACTIONS } from "./registerForm.types";

export const registerFormInitialState: RegisterFormState = {
  username: "",
  email: "",
  password: "",
  confirm: "",
  error: "",
  loading: false,
};

export function registerFormReducer(
  state: RegisterFormState,
  action: RegisterFormAction,
): RegisterFormState {
  switch (action.type) {
    case REGISTER_ACTIONS.SET_USERNAME:
      return { ...state, username: action.payload };
    case REGISTER_ACTIONS.SET_EMAIL:
      return { ...state, email: action.payload };
    case REGISTER_ACTIONS.SET_PASSWORD:
      return { ...state, password: action.payload };
    case REGISTER_ACTIONS.SET_CONFIRM:
      return { ...state, confirm: action.payload };
    case REGISTER_ACTIONS.START_SUBMIT:
      return { ...state, error: "", loading: true };
    case REGISTER_ACTIONS.FAIL_SUBMIT:
      return { ...state, error: action.payload };
    case REGISTER_ACTIONS.END_SUBMIT:
      return { ...state, loading: false };
    default:
      return state;
  }
}
