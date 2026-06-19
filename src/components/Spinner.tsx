import { cn } from "@/lib/utils"

interface props {
  IsButton?: boolean
  className?: string
}

const Spinner = ({ IsButton, className }: props) => {
  return (
    <div
      className={cn(
        "size-16 animate-spin rounded-full border-4 border-t-transparent",
        { "size-4 border-2 border-white border-t-transparent": IsButton },
        className
      )}
    ></div>
  )
}

export default Spinner
