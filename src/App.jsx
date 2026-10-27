import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import ArtistsList from './pages/ArtistsList.jsx';
import ArtistPage from './pages/ArtistPage.jsx';
import ArtistForm from './pages/ArtistForm.jsx';
import EventsList from './pages/EventsList.jsx';
import EventPage from './pages/EventPage.jsx';
import EventForm from './pages/EventForm.jsx';
import FindBand from './pages/FindBand.jsx';
import UserProfile from './pages/UserProfile.jsx';
import ProfileForm from './pages/ProfileForm.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="artists" element={<ArtistsList />} />
        <Route path="artists/new" element={<ArtistForm />} />
        <Route path="artists/:id" element={<ArtistPage />} />
        <Route path="artists/:id/edit" element={<ArtistForm key="edit" />} />
        <Route path="events" element={<EventsList />} />
        <Route path="events/new" element={<EventForm />} />
        <Route path="events/:id" element={<EventPage />} />
        <Route path="events/:id/edit" element={<EventForm key="edit" />} />
        <Route path="musicians" element={<FindBand />} />
        <Route path="users/:id" element={<UserProfile />} />
        <Route path="users/:id/edit" element={<ProfileForm />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
