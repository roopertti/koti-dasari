import { createContext } from 'react';

// Defaults to "awake" so a component rendered outside SleepOverlay (the admin
// route, tests) behaves normally rather than hiding itself.
export const SleepContext = createContext(false);
