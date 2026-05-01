import React from 'react';

type IconName = 'activity' | 'alertCircle' | 'barChart2' | 'bell' | 'checkCircle' | 'chevronDown' | 'clock' | 'code' | 'database' | 'gitCommit' | 'github' | 'home' | 'layers' | 'layout' | 'list' | 'lock' | 'menu' | 'messageSquare' | 'monitor' | 'package' | 'search' | 'settings' | 'star' | 'trendingUp' | 'trendingDown' | 'users' | 'zap' | 'plus' | 'x' | 'filter';

const icons: Record<IconName, string> = {
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  alertCircle: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 14a1 1 0 110-2 1 1 0 010 2zm0-4a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1z',
  barChart2: 'M18 20V10M12 20V4M6 20v-6',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  checkCircle: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
  chevronDown: 'M6 9l6 6 6-6',
  clock: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 4v4l3 3',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  database: 'M3 3h18v18H3zM3 9h18M9 3v18',
  gitCommit: 'M3 12h18M3 6h18M3 18h18',
  github: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  layout: 'M3 3h18v18H3zM3 9h18M9 3v18',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM12 11V7a4 4 0 10-8 0v4',
  menu: 'M3 12h18M3 6h18M3 18h18',
  messageSquare: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
  monitor: 'M22 12h-4l-3 9L9 3l-3 9H2',
  package: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  settings: 'M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  trendingUp: 'M23 6l-9.5 9.5-5-5L1 18',
  trendingDown: 'M23 18l-9.5-9.5-5 5L1 6',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6L6 18M6 6l12 12',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z'
};

interface IconProps { name: IconName; size?: number; className?: string }

export const Icon: React.FC<IconProps> = ({ name, size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={icons[name]} />
  </svg>
);