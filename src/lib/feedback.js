import { createContext, useContext } from 'react';

// confirm({ title, message, confirmText, danger }) => Promise<boolean>; toast(message, kind?)
export const FeedbackContext = createContext({
  confirm: async () => false,
  toast: () => {},
});

export function useFeedback() {
  return useContext(FeedbackContext);
}
