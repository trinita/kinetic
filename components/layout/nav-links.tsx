"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  items: { href: string; label: string }[];
  className?: string;
  itemClassName?: string;
};

/** Navigation list that marks the current section with aria-current. */
export function NavLinks({ items, className, itemClassName = "" }: Props) {
  const pathname = usePathname();
  return (
    <ul className={className}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${itemClassName} text-muted hover:text-fg aria-[current=page]:text-fg aria-[current=page]:decoration-accent transition aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
