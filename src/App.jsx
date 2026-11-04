import { useEffect, useState } from 'react';
import Shell from './components/Shell.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import PathwayPage from './pages/PathwayPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import TrendsPage from './pages/TrendsPage.jsx';

const PAGES = { profile: ProfilePage, pathway: PathwayPage, ask: ChatPage, trends: TrendsPage };
const current = () => (PAGES[window.location.hash.slice(1)] ? window.location.hash.slice(1) : 'profile');

export default function App() {
  const [page, setPage] = useState(current);
  useEffect(() => {
    const onHash = () => { setPage(current()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const Page = PAGES[page];
  return <Shell page={page}><Page /></Shell>;
}
