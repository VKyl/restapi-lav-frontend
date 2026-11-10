import { Link, useLocation } from 'react-router-dom';
import { displayName, useAuth } from '../auth/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const toast = useToast();
  if (!user) {
    return (
      <Link to="/login" state={{ from: pathname }} className="btn btn-ghost btn-sm">
        <Icon name="user" size={16} /> Sign in
      </Link>
    );
  }

  return (
    <div className="user-menu">
      <Link to={`/users/${user.id}`} className="user-chip" title="Your profile">
        <Avatar name={displayName(user)} size={28} />
        <span className="hide-sm">{user.username}</span>
      </Link>
      <button
        className="icon-btn"
        aria-label="Sign out"
        title="Sign out"
        onClick={async () => {
          await logout();
          toast('Signed out. See you at the next gig.');
        }}
      >
        <Icon name="logout" size={16} />
      </button>
    </div>
  );
}
