import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { VerifyCode } from './pages/VerifyCode';
import { CreateVacancy } from './pages/CreateVacancy';
import { CreateVacancyManual } from './pages/CreateVacancyManual';
import { EditVacancy } from './pages/EditVacancy';
import { VacancyProfiling } from './pages/VacancyProfiling';
import { VacancyChat } from './pages/VacancyChat';
import { PublicVacancy } from './pages/PublicVacancy';
import { CandidateScreening } from './pages/CandidateScreening';
import { CandidateStatus } from './pages/CandidateStatus';
import { VacancyDashboard } from './pages/VacancyDashboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { CandidateDetails } from './pages/CandidateDetails';
import { BuyTokens } from './pages/BuyTokens';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/buy-tokens" element={<BuyTokens />} />
        <Route path="/create-vacancy" element={<CreateVacancy />} />
        <Route path="/create-vacancy/manual" element={<CreateVacancyManual />} />
        <Route path="/vacancy/:vacancyId/edit" element={<EditVacancy />} />
        <Route path="/vacancy/:id/profiling" element={<VacancyProfiling />} />
        <Route path="/vacancy/:id/chat" element={<VacancyChat />} />
        <Route path="/vacancy/:slug" element={<PublicVacancy />} />
        <Route path="/vacancy/:publicLink/candidate/:candidateId/status" element={<CandidateStatus />} />
        <Route path="/candidate/:candidateId/screening" element={<CandidateScreening />} />
        <Route path="/candidate/:candidateId/details" element={<CandidateDetails />} />
        <Route path="/vacancy/:vacancyId/dashboard" element={<VacancyDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
