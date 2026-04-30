import { getToken, getUser } from "../utils/auth";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = getToken();

  // ❌ chưa login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ⚠️ optional: check user tồn tại
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
