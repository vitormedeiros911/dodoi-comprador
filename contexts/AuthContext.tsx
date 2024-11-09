import { SessionStorageDto } from "@/dto/SessionStorageDto";
import { api } from "@/services/api";
import { storageUserGet, storageUserSave } from "@/storage/storageUser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { Alert } from "react-native";

export type AuthContextDataProps = {
  session: SessionStorageDto;
  signIn: () => void;
  signOut: () => void;
};

type AuthContextProviderProps = {
  children: React.ReactNode;
};

export const AuthContext = createContext<AuthContextDataProps>(
  {} as AuthContextDataProps
);

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [session, setSession] = useState<SessionStorageDto>({
    user: {},
    token: "",
  } as SessionStorageDto);

  async function signIn() {
    try {
      const googleResponse = await GoogleSignin.signIn();

      const idToken = googleResponse.data?.idToken;

      if (idToken) {
        const response = await api.post("/auth/login", { idToken });

        if (response.data) {
          const user = {
            id: response.data.usuario.id,
            nome: response.data.usuario.nome,
            email: response.data.usuario.email,
            avatar: response.data.usuario.urlImagem,
          };

          setSession({ user, token: response.data.access_token });
          storageUserSave(user, response.data.access_token);
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error))
        if (error.response?.data?.message)
          Alert.alert(error.response.data.message);
        else Alert.alert("Não foi possível realizar o login.");
    }
  }

  async function signOut() {
    setSession({
      user: {},
      token: "",
    } as SessionStorageDto);
  }

  async function loadUserData() {
    const userLogged = await storageUserGet();

    if (userLogged) setSession(userLogged);
  }

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <AuthContext.Provider value={{ session, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
