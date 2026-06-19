import { toast, type Renderable, type Toast, type ToastOptions, type ValueOrFunction } from "react-hot-toast"

type NotifyMessage = ValueOrFunction<Renderable, Toast>
type NotifyToastOptions = ToastOptions

export const notify = {
  success(message: NotifyMessage, options?: NotifyToastOptions) {
    return toast.success(message, options)
  },
  info(message: NotifyMessage, options?: NotifyToastOptions) {
    return toast(message, options)
  },
  error(message: NotifyMessage, options?: NotifyToastOptions) {
    return toast.error(message, options)
  },
  loading(message: NotifyMessage, options?: NotifyToastOptions) {
    return toast.loading(message, options)
  },
  normal(message: NotifyMessage, options?: NotifyToastOptions) {
    return toast(message, options)
  },
  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: {
      loading: Renderable
      success: ValueOrFunction<Renderable, T>
      error: ValueOrFunction<Renderable, Error>
    },
    options?: {
      loading?: ToastOptions
      success?: ToastOptions
      error?: ToastOptions
    }
  ) {
    return toast.promise(promise, messages, options)
  },
  custom(renderer: ValueOrFunction<Renderable, Toast>, options?: ToastOptions) {
    return toast.custom(renderer, options)
  },
  dismiss(toastId?: string) {
    toast.dismiss(toastId)
  },
  remove(toastId?: string) {
    toast.remove(toastId)
  },
}

export function useNotify() {
  return notify
}
