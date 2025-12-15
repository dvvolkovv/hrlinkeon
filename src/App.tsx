import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { VerifyCode } from './pages/VerifyCode';
import { CreateVacancy } from './pages/CreateVacancy';
import { CreateVacancyManual } from './pages/CreateVacancyManual';
import { EditVacancy } from './pages/EditVacancy';
import { VacancyProfiling } from './pages/VacancyProfiling';
import { VacancyChat } from './pages/VacancyChat';
import { VacancyCandidatesChat } from './pages/VacancyCandidatesChat';
import { PublicVacancy } from './pages/PublicVacancy';
import { CandidateScreening } from './pages/CandidateScreening';
import { CandidateStatus } from './pages/CandidateStatus';
import { CandidateInterviewChat } from './pages/CandidateInterviewChat';
import { VacancyDashboard } from './pages/VacancyDashboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { CandidateDetails } from './pages/CandidateDetails';
import { BuyTokens } from './pages/BuyTokens';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { OpenVacancies } from './pages/OpenVacancies';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/open-vacancies" element={<OpenVacancies />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/buy-tokens" element={<BuyTokens />} />
        <Route path="/create-vacancy" element={<CreateVacancy />} />
        <Route path="/create-vacancy/manual" element={<CreateVacancyManual />} />
        <Route path="/vacancy/:vacancyId/edit" element={<EditVacancy />} />
        <Route path="/vacancy/:id/profiling" element={<VacancyProfiling />} />
        <Route path="/vacancy/:id/chat" element={<VacancyChat />} />
        <Route path="/vacancy/:vacancyId/candidates-chat" element={<VacancyCandidatesChat />} />
        <Route path="/vacancy/:slug" element={<PublicVacancy />} />
        <Route path="/public/vacancies/:publicLink/candidates/:candidateId/status" element={<CandidateStatus />} />
        <Route path="/public/vacancies/:publicLink/candidates/:candidateId/interview" element={<CandidateInterviewChat />} />
        <Route path="/vacancy/:publicLink/candidate/:candidateId/status" element={<CandidateStatus />} />
        <Route path="/candidate/:candidateId/screening" element={<CandidateScreening />} />
        <Route path="/candidate/:candidateId/details" element={<CandidateDetails />} />
        <Route path="/vacancy/:vacancyId/dashboard" element={<VacancyDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
