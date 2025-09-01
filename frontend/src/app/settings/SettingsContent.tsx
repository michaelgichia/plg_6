'use client'

import { useState } from "react"
import { useAuthContext } from "@/contexts/AuthContext"
import UserInformation from "./components/UserInformation"
import ChangePassword from "./components/ChangePassword"
import Appearance from "./components/Appearance"
import DeleteAccount from "./components/DeleteAccount"

const tabs = [
  { id: 'my-profile', title: 'My profile', component: UserInformation },
  { id: 'password', title: 'Password', component: ChangePassword },
  { id: 'appearance', title: 'Appearance', component: Appearance },
  { id: 'danger-zone', title: 'Danger zone', component: DeleteAccount },
]

export default function SettingsContent() {
  const { user: currentUser } = useAuthContext()
  const [activeTab, setActiveTab] = useState('my-profile')

  // Hide danger zone for superusers (as per original logic)
  const finalTabs = currentUser?.is_superuser ? tabs.slice(0, 3) : tabs

  const ActiveComponent = finalTabs.find(tab => tab.id === activeTab)?.component || UserInformation

  if (!currentUser) {
    return null
  }

  return (
    <div className="max-w-full">
      <div className="pt-12 mb-6">
        <h1 className="text-lg font-semibold text-center md:text-left py-12 mb-6">
          User Settings
        </h1>

        {/* Tab Navigation */}
        <div className="border-b border-zinc-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {finalTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                }`}
              >
                {tab.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}