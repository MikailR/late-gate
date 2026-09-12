/**
 * Day-1 shell modules that are not part of this pricing lock.
 * Declarations only — do not rebuild or restyle traveler UI here.
 */

declare module "*.css";

declare module "@/components/site-shell" {
  import type { ReactNode } from "react";
  export function SiteShell(props: { children: ReactNode }): ReactNode;
}

declare module "@/components/ui/button" {
  import type { ButtonHTMLAttributes, ReactNode } from "react";
  export function Button(
    props: ButtonHTMLAttributes<HTMLButtonElement> & {
      size?: string;
      variant?: string;
      nativeButton?: boolean;
    },
  ): ReactNode;
  export function buttonVariants(opts?: {
    variant?: string;
    size?: string;
    className?: string;
  }): string;
}

declare module "@/components/ui/input" {
  import type { InputHTMLAttributes, ReactNode } from "react";
  export function Input(
    props: InputHTMLAttributes<HTMLInputElement>,
  ): ReactNode;
}

declare module "@/components/ui/label" {
  import type { LabelHTMLAttributes, ReactNode } from "react";
  export function Label(
    props: LabelHTMLAttributes<HTMLLabelElement>,
  ): ReactNode;
}
