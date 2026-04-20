export const toast = $state({ message: "", visible: false });

let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(msg: string): void {
  toast.message = msg;
  toast.visible = true;
  clearTimeout(timer);
  timer = setTimeout(() => {
    toast.visible = false;
  }, 2600);
}
