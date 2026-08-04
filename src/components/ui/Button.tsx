import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap transition-all duration-300 font-semibold active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-button-primary hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,98,255,0.35)]",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600 hover:-translate-y-0.5",
        outline: "border border-gray-200/80 bg-white/50 backdrop-blur-sm shadow-soft hover:bg-gray-50/80 hover:border-gray-300 text-gray-900",
        secondary: "bg-gray-100/80 backdrop-blur-sm text-gray-900 shadow-sm hover:bg-gray-200/80 hover:-translate-y-0.5",
        ghost: "hover:bg-gray-100/50 hover:text-gray-900 text-gray-700 transition-colors duration-200",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "py-3.5 px-6 rounded-2xl text-[15px]",
        sm: "h-9 rounded-xl px-4 text-sm",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
