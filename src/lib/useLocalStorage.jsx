import { useState, useEffect } from "react";

const useLocalStorage = (key, initialValue) => {
  const getInitialValue = () => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue !== null ? JSON.parse(storedValue) : initialValue;
    } catch (error) {
      console.error("Error getting initial value from local storage:", error);
      return initialValue;
    }
  };

  const [value, setValue] = useState(getInitialValue);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error updating local storage:", error);
    }
  }, [key, value]);

  const updateValue = (newValue) => {
    setValue(newValue);
  };

  return [value, updateValue];
};

export default useLocalStorage;
