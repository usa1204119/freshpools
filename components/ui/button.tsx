import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Two buttons exist in this system. Both are square, both carry an arrow, and
 * the ONLY hover effect is the arrow translating 4px right — no colour change
 * on primary, per the design system.
 */
const buttonVariants = cva(
  "group/btn inline-flex items-center justify-center gap-3 rounded-md border font-sans font-medium leading-none transition-all duration-150 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        /* Buttons are emphasis by definition, so they keep the ink edge. */
        primary: "border-ink bg-ink text-white shadow-sm hover:bg-ink hover:shadow-md",
        secondary:
          "border-line-mid bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-white",
        /** For use on top of an ink-filled block */
        inverse: "border-white bg-white text-ink hover:bg-transparent hover:text-white",
        /** Text-only, used inside cards */
        link: "mono rounded-none border-transparent p-0 text-label underline underline-offset-4 hover:bg-transparent",
      },
      size: {
        default: "px-7 py-4 text-[15px]",
        sm: "px-5 py-3 text-[13px]",
        lg: "px-9 py-5 text-[17px]",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ArrowProps = { show: boolean };

function Arrow({ show }: ArrowProps) {
  if (!show) return null;
  return (
    <span
      aria-hidden="true"
      className="inline-block transition-transform duration-200 ease-out group-hover/btn:translate-x-1"
    >
      →
    </span>
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Set false for buttons where an arrow reads wrong (e.g. "Cancel") */
  arrow?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, arrow = true, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      <Arrow show={arrow} />
    </button>
  ),
);
Button.displayName = "Button";

export interface ButtonLinkProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Link>, "href">,
    VariantProps<typeof buttonVariants> {
  href: string;
  arrow?: boolean;
}

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant, size, arrow = true, children, href, ...props }, ref) => {
    const isExternal = /^https?:\/\//.test(href);
    const classes = cn(buttonVariants({ variant, size }), className);

    if (isExternal) {
      return (
        <a
          ref={ref}
          href={href}
          className={classes}
          target="_blank"
          rel="noreferrer noopener"
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
          <Arrow show={arrow} />
        </a>
      );
    }

    return (
      <Link ref={ref} href={href} className={classes} {...props}>
        {children}
        <Arrow show={arrow} />
      </Link>
    );
  },
);
ButtonLink.displayName = "ButtonLink";

export { buttonVariants };
