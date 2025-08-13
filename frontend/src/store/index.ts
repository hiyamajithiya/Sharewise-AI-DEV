import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slice reducers
import authReducer from './slices/authSlice';
import tradingReducer from './slices/tradingSlice';
import portfolioReducer from './slices/portfolioSlice';
import marketReducer from './slices/marketSlice';
import notificationReducer from './slices/notificationSlice';
import aiStudioReducer from './slices/aiStudioSlice';
import testingReducer from './slices/testingSlice';
import themeReducer from './slices/themeSlice';

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  trading: tradingReducer,
  portfolio: portfolioReducer,
  market: marketReducer,
  notifications: notificationReducer,
  aiStudio: aiStudioReducer,
  testing: testingReducer,
  theme: themeReducer,
});

// Persist config
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'theme'], // Only persist auth and theme state
  blacklist: ['trading', 'portfolio', 'market'], // Don't persist real-time data
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/FLUSH',
          'persist/REHYDRATE', 
          'persist/PAUSE',
          'persist/PERSIST',
          'persist/PURGE',
          'persist/REGISTER',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;