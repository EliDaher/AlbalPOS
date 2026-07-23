import React, { forwardRef } from "react";
import { Input } from "../input";
import { cn } from "@/lib/utils";

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="text-right">
        <label
          htmlFor={props.id}
          className="mb-1 block text-sm font-medium text-foreground"
        >
          {label}
        </label>

        <Input
          ref={ref}
          {...props}
          className={cn("text-right", error && "border-destructive", className)}
        />

        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);

FormInput.displayName = "FormInput";

export default FormInput;
