import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
  GuestRoute,
  ProtectedRoute,
  RootRedirect,
} from '@/features/auth/components/AuthRoutes';
import { AppPage } from '@/pages/AppPage';
import { SignInPage } from '@/pages/SignInPage';
import { SignUpPage } from '@/pages/SignUpPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route element={<GuestRoute />}>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
