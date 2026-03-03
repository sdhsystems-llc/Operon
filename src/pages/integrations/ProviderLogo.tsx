interface Props { id: string; size?: number }

export const ProviderLogo = ({ id, size = 28 }: Props) => {
  const s = size;
  switch (id) {
    case 'aws':
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <path d="M14.5 30.2c-.6.2-1 .6-1.2 1.1-.2.5-.2 1.1.1 1.6.4.8 1.3 1.2 2.2 1.1.9-.1 1.6-.6 2-1.4l3.8-7.4-4.8-2.3-2.1 7.3z" fill="#FF9900"/>
          <path d="M25 8C15.6 8 8 15.6 8 25s7.6 17 17 17 17-7.6 17-17S34.4 8 25 8zm-5.2 23.6c-.5 1-1.4 1.7-2.5 1.9-1.1.2-2.2-.2-2.9-1.1-.5-.6-.7-1.4-.5-2.2l2.2-7.6-1.5-.7.5-1.1 5.9 2.8-.5 1.1-1.5-.7-3.7 7.2c-.2.4-.2.8 0 1.1.2.3.6.5 1 .4.4-.1.8-.3 1-.7l3.8-7.4 1.5.7-2.8 6.3zm11.4 2.7l-1.4-4.7h-5.6l-1.4 4.7h-1.9l4.9-16h2.4l4.9 16h-1.9zm-.6-6.5l-2.2-7.4-2.2 7.4h4.4z" fill="#FF9900"/>
        </svg>
      );
    case 'azure':
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <path d="M20 8l-12 22h8l12-6-8-16z" fill="#0078D4"/>
          <path d="M23 12l-7 18 20 6-13-24z" fill="#0099FF"/>
          <path d="M8 30l24 12-16-12H8z" fill="#50E6FF"/>
        </svg>
      );
    case 'splunk':
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <rect width="50" height="50" rx="8" fill="#65A637"/>
          <path d="M12 20h16l10 5-10 5H12l10-5z" fill="white" opacity="0.9"/>
          <path d="M12 30h20l6 3H18l-6-3z" fill="white" opacity="0.6"/>
        </svg>
      );
    case 'grafana':
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <circle cx="25" cy="25" r="20" fill="#1A1A2E"/>
          <circle cx="25" cy="25" r="8" fill="#F46800"/>
          <path d="M25 10v6M25 34v6M10 25h6M34 25h6" stroke="#F46800" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14.6 14.6l4.2 4.2M31.2 31.2l4.2 4.2M14.6 35.4l4.2-4.2M31.2 18.8l4.2-4.2" stroke="#F46800" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'datadog':
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <rect width="50" height="50" rx="8" fill="#632CA6"/>
          <path d="M20 15l15 4-3 8-12 3V15z" fill="white" opacity="0.9"/>
          <path d="M32 25l5 8-17-2 2-10 10 4z" fill="white" opacity="0.7"/>
          <path d="M15 30l5-10 10 4-12 8-3-2z" fill="white" opacity="0.5"/>
        </svg>
      );
    case 'launchdarkly':
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <rect width="50" height="50" rx="8" fill="#405BFF"/>
          <path d="M25 12l13 7.5v15L25 42l-13-7.5v-15L25 12z" fill="white" opacity="0.15"/>
          <circle cx="25" cy="25" r="8" fill="white"/>
          <circle cx="25" cy="25" r="4" fill="#405BFF"/>
        </svg>
      );
    case 'pagerduty':
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <rect width="50" height="50" rx="8" fill="#06AC38"/>
          <rect x="18" y="10" width="6" height="22" rx="3" fill="white"/>
          <circle cx="21" cy="38" r="4" fill="white"/>
        </svg>
      );
    case 'github':
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <circle cx="25" cy="25" r="22" fill="#24292F"/>
          <path d="M25 11a14 14 0 00-4.42 27.28c.7.13.96-.3.96-.67v-2.37c-3.9.85-4.72-1.88-4.72-1.88-.64-1.62-1.56-2.05-1.56-2.05-1.27-.87.1-.85.1-.85 1.4.1 2.14 1.44 2.14 1.44 1.25 2.14 3.27 1.52 4.07 1.16.13-.9.49-1.52.89-1.87-3.1-.35-6.37-1.55-6.37-6.9 0-1.52.54-2.77 1.43-3.75-.14-.35-.62-1.77.14-3.7 0 0 1.17-.37 3.83 1.43a13.3 13.3 0 016.96 0c2.66-1.8 3.83-1.43 3.83-1.43.76 1.93.28 3.35.14 3.7.89.98 1.43 2.23 1.43 3.75 0 5.36-3.27 6.54-6.39 6.88.5.43.95 1.29.95 2.6v3.85c0 .37.25.81.97.67A14 14 0 0025 11z" fill="white"/>
        </svg>
      );
    case 'jira':
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <rect width="50" height="50" rx="8" fill="#0052CC"/>
          <path d="M25 10l-14.5 14.5 8 8L25 26l6.5 6.5 8-8L25 10z" fill="white" opacity="0.4"/>
          <path d="M25 18l-6.5 6.5 6.5 6.5 6.5-6.5L25 18z" fill="white"/>
        </svg>
      );
    case 'slack':
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <rect x="14" y="10" width="7" height="18" rx="3.5" fill="#E01E5A"/>
          <rect x="29" y="22" width="7" height="18" rx="3.5" fill="#2EB67D"/>
          <rect x="10" y="29" width="18" height="7" rx="3.5" fill="#ECB22E"/>
          <rect x="22" y="14" width="18" height="7" rx="3.5" fill="#36C5F0"/>
          <rect x="10" y="22" width="7" height="7" rx="3.5" fill="#E01E5A"/>
          <rect x="33" y="22" width="7" height="7" rx="3.5" fill="#2EB67D"/>
          <rect x="22" y="10" width="7" height="7" rx="3.5" fill="#36C5F0"/>
          <rect x="22" y="33" width="7" height="7" rx="3.5" fill="#ECB22E"/>
        </svg>
      );
    case 'teams':
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <rect width="50" height="50" rx="8" fill="#6264A7"/>
          <circle cx="29" cy="17" r="6" fill="white" opacity="0.9"/>
          <path d="M29 24c-5 0-10 2.5-10 7v2h20v-2c0-4.5-5-7-10-7z" fill="white" opacity="0.9"/>
          <circle cx="18" cy="19" r="4.5" fill="white" opacity="0.7"/>
          <path d="M18 25c-3.5 0-7 1.8-7 5v1.5h7v-1.5c0-1.8.8-3.4 2-4.7-.6-.2-1.3-.3-2-.3z" fill="white" opacity="0.7"/>
        </svg>
      );
    case 'mcp':
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <rect width="50" height="50" rx="8" fill="#0f1117" stroke="#10b981" strokeWidth="1.5"/>
          <circle cx="25" cy="25" r="9" fill="none" stroke="#10b981" strokeWidth="1.5"/>
          <path d="M25 16v4M25 30v4M16 25h4M30 25h4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="25" cy="25" r="3" fill="#10b981"/>
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
          <rect width="50" height="50" rx="8" fill="var(--bg-elevated)"/>
          <circle cx="25" cy="25" r="10" fill="var(--border)"/>
        </svg>
      );
  }
};
