import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_3px_0_rgba(0,0,0,0.3)] dark:shadow-[0_3px_0_rgba(0,0,0,0.5)] [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground shadow-[0_3px_0_rgba(0,0,0,0.08)] dark:border-input dark:bg-input/30 dark:hover:bg-input/50 dark:shadow-[0_3px_0_rgba(0,0,0,0.35)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground shadow-[0_3px_0_rgba(0,0,0,0.1)] dark:shadow-[0_3px_0_rgba(0,0,0,0.4)]",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/15 text-destructive hover:bg-destructive/25 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 shadow-[0_3px_0_rgba(0,0,0,0.12)] dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40 dark:shadow-[0_3px_0_rgba(0,0,0,0.4)]",
        create:
          "bg-brand-green text-white hover:bg-brand-green/80 focus-visible:ring-brand-green/30 shadow-[0_3px_0_#1a3824] dark:bg-brand-green/90 dark:hover:bg-brand-green dark:shadow-[0_3px_0_#152d1c]",
        add: "bg-brand-teal text-white hover:bg-brand-teal/80 focus-visible:ring-brand-teal/30 shadow-[0_3px_0_#2d8a87] dark:bg-brand-teal/90 dark:hover:bg-brand-teal dark:shadow-[0_3px_0_#246b68]",
        delete:
          "bg-brand-red text-white hover:bg-brand-red/80 focus-visible:ring-brand-red/30 shadow-[0_3px_0_#8f2020] dark:bg-brand-red/90 dark:hover:bg-brand-red dark:shadow-[0_3px_0_#701818]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export { buttonVariants };
export type { VariantProps };
