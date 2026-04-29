import { useContext } from "react";
import { ThemeContext } from "../context/theme/ThemeContext";

export default function useTheme() {
  return useContext(ThemeContext);
}
