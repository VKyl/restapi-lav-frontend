import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useDocumentTitle } from '../hooks/useApi.js';
import Icon from '../components/Icon.jsx';
import Field from '../components/Field.jsx';
import { useToast } from '../components/Toast.jsx';
import { EmptyState, ErrorState, FormError, Loader } from '../components/States.jsx';
import { errorFor, focusField } from '../utils/errors.js';
import { isPast, toLocalInputValue } from '../utils/format.js';

const LIMITS = { name: 200, location: 200, description: 5000, contact_info: 255 };
const EMPTY = { name: '', date: '', location: '', description: '', contact_info: '' };

function validate(form) {
  if (!form.name.trim()) return { field: 'name', message: 'Give your event a name.' };
  if (!form.date) return { field: 'date', message: 'Pick a date and time.' };
  if (new Date(form.date).getTime() <= Date.now()) return { field: 'date', message: 'The event must be in the future.' };
  if (!form.location.trim()) return { field: 'location', message: 'Where is it happening?' };
  if (!form.description.trim()) return { field: 'description', message: 'Tell people what to expect.' };
  if (!form.contact_info.trim()) return { field: 'contact_info', message: 'Add a way to get in touch.' };
  return null;
}

export default function EventForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [load, setLoad] = useState({ loading: isEdit, error: null, past: false });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useDocumentTitle(isEdit ? 'Edit event' : 'New event');

  useEffect(() => {
    if (!isEdit) return;
    const ctrl = new AbortController();
    api.events
      .get(id, { signal: ctrl.signal })
      .then((e) => {
        setForm({
          name: e.name,
          date: toLocalInputValue(e.date),
          location: e.location,
          description: e.description,
          contact_info: e.contact_info,
        });
        setLoad({ loading: false, error: null, past: isPast(e.date) });
      })
      .catch((err) => err.name !== 'AbortError' && setLoad({ loading: false, error: err, past: false }));
    return () => ctrl.abort();
  }, [id, isEdit]);

  useEffect(() => {
    if (error?.field) focusField(error.field);
  }, [error]);

  const bind = (key) => ({
    id: key,
    'data-field': key,
    value: form[key],
    maxLength: LIMITS[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  async function onSubmit(e) {
    e.preventDefault();
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    const body = {
      name: form.name.trim(),
      date: new Date(form.date).toISOString(),
      location: form.location.trim(),
      description: form.description.trim(),
      contact_info: form.contact_info.trim(),
    };
    try {
      if (isEdit) {
        await api.events.update(id, body);
        toast('Event updated');
        navigate(`/events/${id}`);
      } else {
        const res = await api.events.create(body);
        toast('Your event is live');
        navigate(`/events/${res.id}`);
      }
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  if (load.loading) return <div className="container page"><Loader /></div>;
  if (load.error) return <div className="container page"><ErrorState error={load.error} /></div>;

  const cancelTo = isEdit ? `/events/${id}` : '/events';

  if (load.past) {
    return (
      <div className="container page page-narrow">
        <EmptyState
          icon="clock"
          title="This event has already happened"
          action={
            <Link to={cancelTo} className="btn btn-ghost">
              Back to event
            </Link>
          }
        >
          Past events can’t be edited.
        </EmptyState>
      </div>
    );
  }

  const minDate = toLocalInputValue(new Date().toISOString());

  return (
    <div className="container page page-narrow">
      <Link to={cancelTo} className="back-link">
        <Icon name="arrowLeft" size={16} /> {isEdit ? 'Back to event' : 'All events'}
      </Link>
      <header className="form-header">
        <span className="eyebrow">{isEdit ? 'Editing event' : 'New event'}</span>
        <h1>{isEdit ? form.name : 'Post an event'}</h1>
        <p className="lead">Gig, jam session, open mic, festival — share the details and let people find you.</p>
      </header>

      <form onSubmit={onSubmit} className="form" noValidate>
        <FormError error={error} />
        <div className="card form-card">
          <Field label="Event name" htmlFor="name" error={errorFor(error, 'name')} count={form.name.length} max={LIMITS.name}>
            <input className="input input-lg" placeholder="e.g. Friday Night Blues Jam" autoFocus={!isEdit} {...bind('name')} />
          </Field>
          <div className="field-row">
            <Field label="Date & time" htmlFor="date" error={errorFor(error, 'date')} hint="Shown in each visitor’s local time.">
              <input type="datetime-local" className="input" min={minDate} {...bind('date')} />
            </Field>
            <Field label="Location" htmlFor="location" error={errorFor(error, 'location')}>
              <input className="input" placeholder="Venue, city" {...bind('location')} />
            </Field>
          </div>
          <Field
            label="Description"
            htmlFor="description"
            error={errorFor(error, 'description')}
            count={form.description.length}
            max={LIMITS.description}
            hint="Line-up, tickets, what to bring. Leave a blank line between paragraphs."
          >
            <textarea className="input textarea" rows={8} placeholder="What’s happening?" {...bind('description')} />
          </Field>
          <Field
            label="Contact info"
            htmlFor="contact_info"
            error={errorFor(error, 'contact_info')}
            count={form.contact_info.length}
            max={LIMITS.contact_info}
          >
            <input className="input" placeholder="Email, phone or social handle" {...bind('contact_info')} />
          </Field>
        </div>
        <div className="form-actions">
          <Link to={cancelTo} className="btn btn-ghost">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Publish event'}
          </button>
        </div>
      </form>
    </div>
  );
}
