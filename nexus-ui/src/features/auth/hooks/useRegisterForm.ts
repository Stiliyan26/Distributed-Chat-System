import { useMemo, useReducer } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/auth/useAuth";
import { ROUTES } from "@/shared/constants/routes";
import { extractApiErrorMessage } from "@/shared/utils/extractApiErrorMessage";

import { AUTH_MESSAGES } from "../constants/auth";
import {
  registerFormInitialState,
  registerFormReducer,
} from "../state/registerForm.reducer";
import { getStrength } from "../state/registerForm.strength";
import { REGISTER_ACTIONS } from "../state/registerForm.types";

export function useRegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(registerFormReducer, registerFormInitialState);

  const strength = useMemo(() => {
    return getStrength(state.password);
  }, [state.password]);

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: REGISTER_ACTIONS.START_SUBMIT });

    if (state.password !== state.confirm) {
      dispatch({
        type: REGISTER_ACTIONS.FAIL_SUBMIT,
        payload: AUTH_MESSAGES.passwordMismatch,
      });
      dispatch({ type: REGISTER_ACTIONS.END_SUBMIT });
      return;
    }

    try {
      await register(state.username, state.email, state.password);
      navigate(ROUTES.home);
    } catch (error) {
      dispatch({
        type: REGISTER_ACTIONS.FAIL_SUBMIT,
        payload: extractApiErrorMessage(error, AUTH_MESSAGES.registrationFailed),
      });
    } finally {
      dispatch({ type: REGISTER_ACTIONS.END_SUBMIT });
    }
  };

  return {
    state,
    strength,
    setUsername: (username: string) => dispatch({ type: REGISTER_ACTIONS.SET_USERNAME, payload: username }),
    setEmail: (email: string) => dispatch({ type: REGISTER_ACTIONS.SET_EMAIL, payload: email }),
    setPassword: (password: string) => dispatch({ type: REGISTER_ACTIONS.SET_PASSWORD, payload: password }),
    setConfirm: (confirm: string) => dispatch({ type: REGISTER_ACTIONS.SET_CONFIRM, payload: confirm }),
    submit,
  };
}
