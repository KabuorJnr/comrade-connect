/* global __CAMPUS__ */
// Active campus settings, injected at build time from campuses/<id>/campus.json (see vite.config.js).
export const campus = __CAMPUS__;

// Paired with <datalist id={LOCATIONS_LIST_ID}> rendered once in App.jsx.
export const LOCATIONS_LIST_ID = 'campus-locations';
