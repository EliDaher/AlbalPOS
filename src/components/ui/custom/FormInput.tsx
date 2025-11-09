import { Input } from "../input";

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export default function FormInput({ label, error, className, ...props }: FormInputProps) {
  return (
    <div className="text-right">
      <label htmlFor={props.id} className="block mb-1 text-sm font-medium text-gray-700">
        {label}
      </label>
      <Input
        {...props}
        className={`text-right border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
          error ? "border-red-500" : ""
        } ${className || ""}`}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}
