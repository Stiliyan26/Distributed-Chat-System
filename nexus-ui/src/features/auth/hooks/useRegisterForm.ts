import { useAuth } from "@/context/hooks/useAuth";
import { ROUTES } from "@/shared/constants/routes";
import { extractApiErrorMessage } from "@/shared/utils/extractApiErrorMessage";
import { useMemo, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_MESSAGES } from "../constants/auth";

export type Strength = "WEAK" | "FAIR" | "STRONG" | "VERY STRONG";

type RegisterState = {
  username: string;
  email: string;
  password: string;
  confirm: string;
  error: string;
  loading: boolean;
};

type RegisterAction =
  | { type: "setUsername"; payload: string }
  | { type: "setEmail"; payload: string }
  | { type: "setPassword"; payload: string }
  | { type: "setConfirm"; payload: string }
  | { type: "startSubmit" }
  | { type: "failSubmit"; payload: string }
  | { type: "endSubmit" };

type StrengthMap = Record<number, { label: Strength; color: string; width: string }>;

const initialState: RegisterState = {
  username: "",
  email: "",
  password: "",
  confirm: "",
  error: "",
  loading: false,
};

const strengthMap: StrengthMap = {
  0: { label: "WEAK", color: "bg-red-500", width: "w-1/4" },
  1: { label: "WEAK", color: "bg-red-500", width: "w-1/4" },
  2: { label: "FAIR", color: "bg-amber-500", width: "w-2/4" },
  3: { label: "STRONG", color: "bg-emerald-500", width: "w-3/4" },
  4: { label: "VERY STRONG", color: "bg-indigo-500", width: "w-full" },
};

function reducer(state: RegisterState, action: RegisterAction): RegisterState {
  switch (action.type) {
    case "setUsername":
      return { ...state, username: action.payload };
    case "setEmail":
      return { ...state, email: action.payload };
    case "setPassword":
      return { ...state, password: action.payload };
    case "setConfirm":
      return { ...state, confirm: action.payload };
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

function getStrength(password: string) {
  const checks = {
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numSymbol: /[\d!@#$%^&*]/.test(password),
    length: password.length >= 8,
  };

  const count = Object.values(checks).filter(Boolean).length;

  return {
    ...strengthMap[count],
    checks,
  };
}

export function useRegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, initialState);

  const strength = useMemo(() => {
    return getStrength(state.password)
  }, [state.password]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    dispatch({ type: "startSubmit" });

    if (state.password !== state.confirm) {
      dispatch({ type: "failSubmit", payload: AUTH_MESSAGES.passwordMismatch });
      dispatch({ type: "endSubmit" });
      return;
    }

    try {
      await register(state.username, state.email, state.password);
      navigate(ROUTES.home);
    } catch (error) {
      dispatch({
        type: "failSubmit",
        payload: extractApiErrorMessage(error, AUTH_MESSAGES.registrationFailed),
      });
    } finally {
      dispatch({ type: "endSubmit" });
    }
  };

  return {
    state,
    strength,
    setUsername: (username: string) => dispatch({ type: "setUsername", payload: username }),
    setEmail: (email: string) => dispatch({ type: "setEmail", payload: email }),
    setPassword: (password: string) => dispatch({ type: "setPassword", payload: password }),
    setConfirm: (confirm: string) => dispatch({ type: "setConfirm", payload: confirm }),
    submit,
  };
}
