import { Routes, Route } from 'react-router-dom'
import HostLogin from './pages/HostLogin'
import HostDashboard from './pages/HostDashboard'
import EventDetails from './pages/EventDetails'
import SubmissionForm from './pages/SubmissionForm'
import VotingForm from './pages/VotingForm'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Routes>
        <Route path="/" element={<HostLogin />} />
        <Route path="/dashboard" element={<HostDashboard />} />
        <Route path="/event/:eventId" element={<EventDetails />} />
        <Route path="/submit/:eventId" element={<SubmissionForm />} />
        <Route path="/vote/:eventId" element={<VotingForm />} />
      </Routes>
    </div>
  )
}

export default App
