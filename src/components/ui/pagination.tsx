import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("flex justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center justify-center gap-1.5", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" className="flex" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
  onClick?: () => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
} & Pick<React.ComponentProps<typeof Button>, "size">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  onClick,
  disabled,
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size={size}
      className={cn("h-5 min-w-5 px-1.5 text-xs", className)}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  )
}

function PaginationPrevious({
  className,
  text = "Previous",
  onClick,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof PaginationLink>, "children"> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="sm"
      className={cn("gap-0.5 px-1.5", className)}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <ChevronLeft className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = "Next",
  onClick,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof PaginationLink>, "children"> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="sm"
      className={cn("gap-0.5 px-1.5", className)}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <span className="hidden sm:inline">{text}</span>
      <ChevronRight className="h-3.5 w-3.5" />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex h-7 w-7 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-3.5 w-3.5" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
