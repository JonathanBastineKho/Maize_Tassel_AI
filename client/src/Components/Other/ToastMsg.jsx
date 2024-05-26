import { useEffect } from "react";
import { Toast } from "flowbite-react";

function ToastMsg({ icon, message, open, setOpen, duration = 3000 }) {
  useEffect(() => {
    let timer;

    if (open) {
      timer = setTimeout(() => {
        setOpen(false);
      }, duration);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [open, setOpen, duration]);

  return (
    <div
      className={`fixed bottom-12 right-16 z-50 transition-opacity duration-300 ${
        open ? "opacity-100 ease-out" : "opacity-0 ease-in"
      }`}
    >
      <Toast>
        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200">
          {icon}
        </div>
        <div className="ml-3 text-sm font-normal">{message}</div>
        <Toast.Toggle className="ml-5" onDismiss={() => setOpen(false)} />
      </Toast>
    </div>
  );
}

export default ToastMsg;
