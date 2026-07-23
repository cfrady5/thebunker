import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal, RSC-safe Slot: merges props onto its single element child
 * (the `asChild` pattern). Context-free so it can render inside
 * Server Components, unlike @radix-ui/react-slot >= 1.2.
 */
export function Slot({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  if (React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    return React.cloneElement(child, {
      ...props,
      ...child.props,
      className: cn(className, child.props.className as string | undefined),
    });
  }
  if (React.Children.count(children) > 1) {
    throw new Error("Slot expects a single element child");
  }
  return null;
}
