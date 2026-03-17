"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { type VariantProps } from "class-variance-authority";
import { FilePlus, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

function CreateButton({ children, className, ...props }: ButtonProps) {
  return (
    <Button variant="create" className={className} {...props}>
      <FilePlus />
      {children}
    </Button>
  );
}

function AddButton({ children, className, ...props }: ButtonProps) {
  return (
    <Button variant="add" className={className} {...props}>
      <Plus />
      {children}
    </Button>
  );
}

function DeleteButton({ children, className, ...props }: ButtonProps) {
  return (
    <Button variant="delete" className={className} {...props}>
      <Trash2 />
      {children}
    </Button>
  );
}

export { Button, buttonVariants, CreateButton, AddButton, DeleteButton };
