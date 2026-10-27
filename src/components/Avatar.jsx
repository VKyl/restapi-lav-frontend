import { hueFor, initials } from '../utils/format.js';

export default function Avatar({ name, size = 48, square = false }) {
  return (
    <span
      className={`avatar ${square ? 'avatar-square' : ''}`}
      style={{ '--h': hueFor(name), width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
