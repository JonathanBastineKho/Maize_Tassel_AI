import { useEffect } from "react";
import { Toast } from "flowbite-react";

function ToastMsg({ icon, message, open, setOpen, duration = 3000, color }) {
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
      className={`fixed bottom-8 right-16 transition-opacity duration-300 ${
        open ? "opacity-100 ease-out z-50" : "opacity-0 ease-in"
      }`}
    >
      <Toast>
        <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-${color}-100 text-${color}-500`}>
          {icon}
        </div>
        <div className="ml-3 text-sm font-normal">{message}</div>
        <Toast.Toggle className="ml-5" onDismiss={() => setOpen(false)} />
      </Toast>
    </div>
  );
}

export default ToastMsg;
