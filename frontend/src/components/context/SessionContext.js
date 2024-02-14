import { createContext } from "react";

export const SessionContext = createContext(); // see line 47

export const SessionContextProvider = ({
  token,

  setToken,
  sessionUserID,
  sessionUser,
  setSessionUser,
}) => (
  <SessionContext.Provider
    value={{
      token,
      setToken,
      sessionUserID,
      sessionUser,
      setSessionUser,
    }}
  ></SessionContext.Provider>
);
