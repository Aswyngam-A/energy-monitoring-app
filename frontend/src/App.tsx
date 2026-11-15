import './App.css'
import { Routes, Route } from 'react-router';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';
import NotFoundPage from './pages/NotFoundPage';
import SitesListPage from './pages/SitesListPage';
import SiteDetailPage from './pages/SiteDetailPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/sites" element={<SitesListPage />} />
        <Route path="/sites/:id" element={<SiteDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
export default App
