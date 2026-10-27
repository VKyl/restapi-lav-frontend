import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useApi.js';

export default function NotFound() {
  useDocumentTitle('Not found');
  return (
    <div className="container page not-found">
      <div className="nf-code grad-text">404</div>
      <h1>This track doesn’t exist</h1>
      <p className="lead">The page you’re looking for skipped off the record.</p>
      <Link to="/" className="btn btn-primary">
        Back to the homepage
      </Link>
    </div>
  );
}
