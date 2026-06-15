// Minimal inline-SVG icon set (no external icon dependency).
const S = ({ children, size = 20, ...p }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    {...p}
  >
    {children}
  </svg>
);

export const IconDashboard = (p) => (
  <S {...p}><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></S>
);
export const IconTicket = (p) => (
  <S {...p}><path d="M3 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" /><path d="M13 5v14" strokeDasharray="2 3" /></S>
);
export const IconCar = (p) => (
  <S {...p}><path d="M5 17h14M6 17l-1.5-5.5A2 2 0 0 1 6.4 9h11.2a2 2 0 0 1 1.9 2.5L18 17" /><path d="M5 12h14" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></S>
);
export const IconFlag = (p) => (
  <S {...p}><path d="M4 21V4M4 4c4-2 8 2 12 0v9c-4 2-8-2-12 0" /></S>
);
export const IconUsers = (p) => (
  <S {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></S>
);
export const IconLogout = (p) => (
  <S {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5" /><path d="M5 12h12" /></S>
);
export const IconPlus = (p) => (<S {...p}><path d="M12 5v14M5 12h14" /></S>);
export const IconTrash = (p) => (
  <S {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M10 11v6M14 11v6" /></S>
);
export const IconSearch = (p) => (<S {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></S>);
export const IconBan = (p) => (<S {...p}><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></S>);
export const IconCheck = (p) => (<S {...p}><path d="M20 6 9 17l-5-5" /></S>);
export const IconX = (p) => (<S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>);
export const IconAlert = (p) => (<S {...p}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></S>);
export const IconChevron = (p) => (<S {...p}><path d="m6 9 6 6 6-6" /></S>);
export const IconMenu = (p) => (<S {...p}><path d="M4 6h16M4 12h16M4 18h16" /></S>);
export const IconLoader = (p) => (<S {...p} className="spin"><path d="M12 3a9 9 0 1 0 9 9" /></S>);
export const IconTrend = (p) => (<S {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M17 7h4v4" /></S>);
export const IconRupee = (p) => (<S {...p}><path d="M6 4h12M6 9h12M6 4c5 0 8 1 8 4.5S11 13 6 13c4 2 7 4 9 7" /></S>);
