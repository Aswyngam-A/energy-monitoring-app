import './App.css'
import { Routes, Route } from 'react-router';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';
import NotFoundPage from './pages/NotFoundPage';
import SitesListPage from './pages/SitesListPage';
import SiteDetailPage from './pages/SiteDetailPage';
import SiteNewPage from './pages/SiteNewPage';
import SiteEditPage from './pages/SiteEditPage';
import AlertsPage from './pages/AlertsPage';
import { AlertsProvider } from './context/AlertsContext';

/** The route table: which page shows for which URL. All routes share the Layout frame. */
function App() {
  return (
    // The provider sits above the routes so the nav badge and the alerts page share one load.
    <AlertsProvider>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/sites" element={<SitesListPage />} />
        {/* /sites/new must not be read as /sites/:id; React Router prefers the static path. */}
        <Route path="/sites/new" element={<SiteNewPage />} />
        <Route path="/sites/:id" element={<SiteDetailPage />} />
        <Route path="/sites/:id/edit" element={<SiteEditPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        {/* Catch-all: must stay last. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </AlertsProvider>
  )
}
export default App
