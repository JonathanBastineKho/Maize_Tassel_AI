import axios from "axios";
import { createContext, useState } from "react";

export const StorageContext = createContext();

export const StorageProvider = ({ children }) => {
  const [storage, setStorage] = useState(0);

  const getStorage = async () => {
    try {
      const res = await axios.get("/api/service/total-storage");
      if (res.status === 200) {
        return res.data.count;
      }
    } catch (err) {
      console.error(err);
    }
    return null; // Return null or a default value in case of an error
  };

  return (
    <StorageContext.Provider value={{ storage, setStorage, getStorage }}>
      {children}
    </StorageContext.Provider>
  );
};
