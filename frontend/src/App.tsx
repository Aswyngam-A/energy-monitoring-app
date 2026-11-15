import './App.css'
import { Routes, Route } from 'react-router';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';
import NotFoundPage from './pages/NotFoundPage';
import SitesListPage from './pages/SitesListPage';
import SiteDetailPage from './pages/SiteDetailPage';
import SiteNewPage from './pages/SiteNewPage';
import SiteEditPage from './pages/SiteEditPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/sites" element={<SitesListPage />} />
        <Route path="/sites/new" element={<SiteNewPage />} />
        <Route path="/sites/:id" element={<SiteDetailPage />} />
        <Route path="/sites/:id/edit" element={<SiteEditPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
export default App
