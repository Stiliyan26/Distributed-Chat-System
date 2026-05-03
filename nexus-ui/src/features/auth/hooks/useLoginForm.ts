import { useReducer } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/auth/useAuth";
import { ROUTES } from "@/shared/constants/routes";
import { extractApiErrorMessage } from "@/shared/utils/extractApiErrorMessage";

import { AUTH_MESSAGES } from "../constants/auth";
import { loginFormInitialState, loginFormReducer } from "../state/loginForm.reducer";
import { LOGIN_ACTIONS } from "../state/loginForm.types";

export function useLoginForm() {
  const { login } = useAuth();

  const navigate = useNavigate();

  const [state, dispatch] = useReducer(loginFormReducer, loginFormInitialState);

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: LOGIN_ACTIONS.START_SUBMIT });

    try {
      await login(state.email, state.password);
      navigate(ROUTES.home);
    } catch (error) {
      dispatch({
        type: LOGIN_ACTIONS.FAIL_SUBMIT,
        payload: extractApiErrorMessage(error, AUTH_MESSAGES.loginFailed),
      });
    } finally {
      dispatch({ type: LOGIN_ACTIONS.END_SUBMIT });
    }
  };

  return {
    state,
    setEmail: (email: string) => dispatch({ type: LOGIN_ACTIONS.SET_EMAIL, payload: email }),
    setPassword: (password: string) => dispatch({ type: LOGIN_ACTIONS.SET_PASSWORD, payload: password }),
    togglePassword: () => dispatch({ type: LOGIN_ACTIONS.TOGGLE_PASSWORD }),
    submit,
  };
}
