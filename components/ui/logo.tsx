/* eslint-disable @next/next/no-img-element -- static SVG logo, no optimisation needed */

/** Brand lockup; switches to the light-on-dark version in dark mode. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <>
      <img
        src="/brand/kinetic-logo.svg"
        alt="Kinetic — Bengkel Kayu"
        className={`${className} dark:hidden`}
      />
      <img
        src="/brand/kinetic-logo-dark.svg"
        alt="Kinetic — Bengkel Kayu"
        className={`${className} hidden dark:block`}
      />
    </>
  );
}
