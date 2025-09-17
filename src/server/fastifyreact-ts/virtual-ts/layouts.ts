import { lazy, type ComponentType } from 'react';

const DefaultLayout = () => import('./layouts/default');

const appLayouts = import.meta.glob('./layouts/*.{jsx,tsx}');

if (
  !Object.keys(appLayouts).some((path) =>
    path.match(/\/layouts\/default\.(j|t)sx/),
  )
) {
  appLayouts['/layouts/default.tsx'] = DefaultLayout;
}

// Corrected and more robust export logic
export default Object.keys(appLayouts).reduce((acc, path) => {
  // Use a regular expression to safely extract the filename
  const match = path.match(/\/([\w-]+)\.(jsx|tsx)$/);
  
  // Only add the layout if a valid name was extracted
  if (match && match[1]) {
    const name = match[1];
    acc[name] = lazy(appLayouts[path] as () => Promise<{ default: ComponentType<any> }>);
  }
  
  return acc;
}, {} as Record<string, ReturnType<typeof lazy>>);