"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { VariantProps } from "class-variance-authority";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

interface ClientLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> {
  href: string;
  size?: ButtonVariantProps["size"];
  variant?: ButtonVariantProps["variant"];
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
  const [isNavigating, setIsNavigating] = useState(false);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    props.onClick?.(event);
    if (event.defaultPrevented) return;
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.button !== 0
    ) {
      return;
    }
    if (props.target === "_blank") return;

    setIsNavigating(true);
    window.setTimeout(() => {
      setIsNavigating(false);
    }, 1200);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-busy={isNavigating}
      className={cn(
        buttonVariants({ size, variant }),
        isNavigating && "opacity-85",
        className,
      )}
      {...props}
    >
      {isNavigating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
      {children}
    </Link>
  );
}
