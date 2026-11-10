import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Pages that need a signed-in user. Signed-out visitors go to sign in and come back here after.
// Also covers the session ending mid-page (e.g. refresh token rejected): `user` turns null and we redirect.
export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: pathname + search }} />;
  return children;
}

// Ids can arrive as numbers or strings depending on the source (token vs. API response).
export const sameId = (a, b) => a != null && b != null && String(a) === String(b);
