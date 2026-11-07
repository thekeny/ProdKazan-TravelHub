import toast from "react-hot-toast";

export function actionToast<T>(
  action: () => T | Promise<T>,
  loading: string,
  success: string,
) {
  return toast.promise(Promise.resolve().then(action), {
    loading,
    success,
    error: (error: unknown) =>
      error instanceof Error ? error.message : "Не удалось выполнить действие.",
  });
}
