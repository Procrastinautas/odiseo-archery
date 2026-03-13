"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnchorHTMLAttributes, ReactNode } from "react";

interface ClientLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  size?: any;
  variant?: any;
  children?: ReactNode;
}

export default function ClientLink({
  href,
  size,
  variant,
  className,
  children,
  ...props
}: ClientLinkProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}
