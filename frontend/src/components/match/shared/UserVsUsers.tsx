import type { LucideProps } from 'lucide-react';
import { forwardRef } from 'react';

export const UserVsUsers = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, className = '', ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Single person on the left - matching Lucide User style */}
      <circle cx="5" cy="6" r="3" />
      <path d="M 2 21 L 2 20 C 2 18.3431 3.34315 17 5 17 C 6.65685 17 8 18.3431 8 20 L 8 21" />
      
      {/* Two people on the right - matching Lucide Users style */}
      <circle cx="15.5" cy="6" r="2.5" />
      <path d="M 13 21 L 13 20 C 13 18.6193 14.1193 17.5 15.5 17.5 C 16.8807 17.5 18 18.6193 18 20 L 18 21" />
      
      <circle cx="20.5" cy="6" r="2.5" />
      <path d="M 18 21 L 18 20 C 18 18.6193 19.1193 17.5 20.5 17.5 C 21.8807 17.5 23 18.6193 23 20 L 23 21" />
    </svg>
  )
);

UserVsUsers.displayName = 'UserVsUsers';
