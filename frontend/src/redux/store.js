import { configureStore } from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import userReducer from "./userSlice";
import messageReducer from "./messageSlice";
import socketReducer from "./socketSlice";

const noopStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
  clear: async () => undefined,
};

const baseStorage =
  typeof window !== "undefined" && window.localStorage
    ? window.localStorage
    : noopStorage;

const storage = {
  getItem: (key) => Promise.resolve(baseStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(baseStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(baseStorage.removeItem(key)),
  clear: () => Promise.resolve(baseStorage.clear()),
};

const userPersistConfig = {
  key: "chatapp-user",
  storage,
  whitelist: ["authUser", "selectedUser", "otherUser", "onlineUsers"],
};

const persistedUserReducer = persistReducer(userPersistConfig, userReducer);

const store = configureStore({
  reducer: {
    user: persistedUserReducer,
    message: messageReducer,
    socket: socketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          "socket/setSocket",
        ],
        ignoredPaths: ["socket.socket"],
      },
    }),
});

export const persistor = persistStore(store);
export default store;