import type { RefObject } from 'react';

/**
 * Defines the shape of the shared state object that controls which screen is visible.
 * This is the single source of truth for the UI state.
 */
export interface ScreenState {
  // Use string to allow any screen name, making the renderer generic.
  screen: string; 
  headerDisplay: boolean;
  scroll: boolean;
}

/**
 * Defines the props that will be passed down from the ScreenRenderer 
 * to every individual screen component (e.g., MainScreen, AboutMeScreen).
 */
export interface ScreenComponentProps {
  lastScreenState: ScreenState | null;
  handleScreenChange: (newState: ScreenState) => void; 
  // This prop is optional because not every screen component may need it.
  pointerScreenRef?: RefObject<HTMLDivElement | null>;
}

/**
 * Defines the props required by the ScreenRenderer component itself.
 */
export interface ScreenRendererProps {
  // The key to the dynamic import, e.g., "landpage" or "admin".
  screenSource: string; 
  handleScreenChange: (newState: ScreenState) => void;
  screenState: ScreenState;
  lastScreenState: ScreenState | null;
  pointerScreenRef: RefObject<HTMLDivElement | null>; 
}