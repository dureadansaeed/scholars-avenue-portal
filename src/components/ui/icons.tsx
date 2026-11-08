import type { SVGProps } from "react";

// One weight (stroke 1.6), round caps, currentColor. Add glyphs here, never an
// icon library and never emoji.
function svg(paths: React.ReactNode) {
  return function Glyph({ className = "size-4", ...rest }: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"
        strokeLinejoin="round" aria-hidden className={className} {...rest}>
        {paths}
      </svg>
    );
  };
}

export const Icon = {
  Logo: svg(<><path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" /><path d="M7 12v4.2c0 .9 2.2 2.3 5 2.3s5-1.4 5-2.3V12" /><path d="M21 9.5V15" /></>),
  Home: svg(<><path d="M4 11 12 4l8 7" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" /></>),
  User: svg(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.4 3.6-5 7-5s6.2 1.6 7 5" /></>),
  Users: svg(<><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.6-3 2.9-4.5 5.5-4.5s4.9 1.5 5.5 4.5" /><path d="M15.5 5.7a3 3 0 0 1 0 5.6" /><path d="M17 14.6c2 .5 3.2 2 3.5 4.4" /></>),
  File: svg(<><path d="M7 3.5h6.5L18 8v12.5H7Z" /><path d="M13.5 3.5V8H18" /></>),
  Folder: svg(<><path d="M3.5 7.5a1.5 1.5 0 0 1 1.5-1.5h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18Z" /></>),
  Book: svg(<><path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3Z" /><path d="M5 17a3 3 0 0 1 3-3h10" /></>),
  Send: svg(<><path d="M20.5 3.5 10 14" /><path d="M20.5 3.5 14 20.5l-4-6.5-6.5-4Z" /></>),
  Check: svg(<path d="m5 12.5 4.5 4.5L19 7.5" />),
  CheckCircle: svg(<><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.4 2.4 4.6-5" /></>),
  Clock: svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  Alert: svg(<><path d="M12 4 3 19.5h18Z" /><path d="M12 10v4.5" /><path d="M12 17.2v.1" /></>),
  Info: svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><path d="M12 8v.1" /></>),
  Bell: svg(<><path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>),
  Upload: svg(<><path d="M12 15.5V4.5" /><path d="m7.5 9 4.5-4.5L16.5 9" /><path d="M4.5 15v3.5h15V15" /></>),
  Download: svg(<><path d="M12 4.5v11" /><path d="m7.5 11 4.5 4.5 4.5-4.5" /><path d="M4.5 19.5h15" /></>),
  Plus: svg(<><path d="M12 5v14" /><path d="M5 12h14" /></>),
  X: svg(<><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>),
  Chevron: svg(<path d="m9 6 6 6-6 6" />),
  ChevronDown: svg(<path d="m6 9 6 6 6-6" />),
  Sidebar: svg(<><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><path d="M9.5 4.5v15" /></>),
  Menu: svg(<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>),
  Lock: svg(<><rect x="5.5" y="10.5" width="13" height="9" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>),
  Eye: svg(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>),
  Edit: svg(<><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17Z" /><path d="m14 8 3 3" /></>),
  Refresh: svg(<><path d="M19.5 12a7.5 7.5 0 1 1-2.3-5.4" /><path d="M19.5 4.5v4h-4" /></>),
  Globe: svg(<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17" /><path d="M12 3.5c2.5 2.4 3.5 5.3 3.5 8.5s-1 6.1-3.5 8.5c-2.5-2.4-3.5-5.3-3.5-8.5S9.5 5.9 12 3.5Z" /></>),
  Link: svg(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" /></>),
  Chat: svg(<><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3.5V16h0A2.5 2.5 0 0 1 4 13.5Z" /></>),
  List: svg(<><path d="M9 7h11" /><path d="M9 12h11" /><path d="M9 17h11" /><path d="M4.5 7h.1" /><path d="M4.5 12h.1" /><path d="M4.5 17h.1" /></>),
  Spinner: svg(<><circle cx="12" cy="12" r="9" strokeWidth={3} opacity={0.25} /><path d="M21 12a9 9 0 0 0-9-9" strokeWidth={3} /></>),
};
