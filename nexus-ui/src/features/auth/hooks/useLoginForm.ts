import { useAuth } from "@/context/useAuth";
import { ROUTES } from "@/shared/constants/routes";
import { extractApiErrorMessage } from "@/shared/utils/extractApiErrorMessage";
import { useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_MESSAGES } from "../constants/auth";

type LoginFormState = {
  email: string;
  password: string;
  showPassword: boolean;
  error: string;
  loading: boolean;
};

type LoginFormAction =
  | { type: "setEmail"; payload: string }
  | { type: "setPassword"; payload: string }
  | { type: "togglePassword" }
  | { type: "startSubmit" }
  | { type: "failSubmit"; payload: string }
  | { type: "endSubmit" };

const initialState: LoginFormState = {
  email: "",
  password: "",
  showPassword: false,
  error: "",
  loading: false,
};

function reducer(state: LoginFormState, action: LoginFormAction): LoginFormState {
  switch (action.type) {
    case "setEmail":
      return { ...state, email: action.payload };
    case "setPassword":
      return { ...state, password: action.payload };
    case "togglePassword":
      return { ...state, showPassword: !state.showPassword };
    case "startSubmit":
      return { ...state, error: "", loading: true };
    case "failSubmit":
      return { ...state, error: action.payload };
    case "endSubmit":
      return { ...state, loading: false };
    default:
      return state;
  }
}

export function useLoginForm() {
  const { login } = useAuth();

  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, initialState);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    dispatch({ type: "startSubmit" });

    try {
      await login(state.email, state.password);
      navigate(ROUTES.home);
    } catch (error) {
      dispatch({
        type: "failSubmit",
        payload: extractApiErrorMessage(error, AUTH_MESSAGES.loginFailed),
      });
    } finally {
      dispatch({ type: "endSubmit" });
    }
  };

  return {
    state,
    setEmail: (email: string) => dispatch({ type: "setEmail", payload: email }),
    setPassword: (password: string) => dispatch({ type: "setPassword", payload: password }),
    togglePassword: () => dispatch({ type: "togglePassword" }),
    submit,
  };
}
