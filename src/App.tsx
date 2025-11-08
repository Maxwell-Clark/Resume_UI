import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { TailoringPage } from '@/pages/TailoringPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { AccountSettingsPage } from '@/pages/AccountSettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<TailoringPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/account" element={<AccountSettingsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
