import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import AdminPage from './pages/AdmninPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/admin',
    element: <AdminPage />,
  }
]);

export function Router() {

  return <>
  <RouterProvider router={router} />;
  </>
}
