export const inputTheme = {
  field: {
    input: {
      colors: {
        gray:
          "bg-gray-50 border-gray-300 text-gray-900 focus:border-green-500 focus:ring-green-500",
      },
    },
  },
};

export const textAreaTheme = {
  colors: {
    gray: "bg-gray-50 border-gray-300 text-gray-900 focus:border-green-500 focus:ring-green-500"
  }
}

export const checkBoxTheme = {
    root : {
        color : {
            default : "text-green-600 focus:ring-green-600"
        }
    }
}

export const spinnerTheme = {
    color : {
        info : "fill-green-600"
    }
}

export const navbarTheme = {
  link : {
    active: {
      on : "bg-green-700 text-white md:bg-transparent md:text-green-700",
      off : "border-b border-gray-100 text-gray-700 hover:bg-gray-50 md:border-0 md:hover:bg-transparent md:hover:text-green-700"
    }
  }
}

export const sidebarTheme = {
  root : {
    base: "h-screen border-r fixed pt-20 bg-white",
    inner: "h-full overflow-y-auto overflow-x-hidden rounded px-3 py-4",
    collapsed: {
      on: "w-16 transition-all duration-100 ease-in-out",
      off: "w-64 transition-all duration-100 ease-in-out",
    },
  }
}

export const progressTheme = {
  color: {
    green : "bg-green-500"
  }
}

export const tableTheme = {
  root: {
    base: "w-full text-left text-sm text-gray-500 dark:text-gray-400",
    shadow: "",
    wrapper: "relative"
  },
}

export const toggleSwitchTheme = {
  toggle: {
    base: "after:rounded-full rounded-full border group-focus:ring-4 group-focus:ring-cyan-500/25",
    checked: {
        on: "after:bg-white after:translate-x-full",
        off: "after:bg-white border-gray-200 bg-gray-200",
    },
  },
}

export const datepickerTheme = {
  "popup": {
    "root": {
      "base": "absolute top-10 z-[100] block pt-2"
    },
    "footer": {
      "button": {
        "base": "w-full rounded-lg px-5 py-2 text-center text-sm font-medium focus:ring-4 focus:ring-green-300",
        "today": "bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700"
      }
    }
  },
  "views": {
    "days": {
      "items": {
        "item": {
          "selected": "bg-green-700 text-white hover:bg-green-600"
        }
      }
    },
    "months": {
      "items": {
        "item": {
          "selected": "bg-green-700 text-white hover:bg-green-600"
        }
      }
    },
    "years": {
      "items": {
        "item": {
          "selected": "bg-green-700 text-white hover:bg-green-600"
        }
      }
    },
    "decades": {
      "items": {
        "item": {
          "selected": "bg-green-700 text-white hover:bg-green-600"
        }
      }
    }
  }
};

export const isValidDate = (dateString) => {
  if (dateString === null) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const isValidInteger = (value) => {
  if (value === null || value === undefined) return false;
  const parsedValue = parseInt(value);
  return !isNaN(parsedValue) && parsedValue == value && parsedValue >= 0;
};