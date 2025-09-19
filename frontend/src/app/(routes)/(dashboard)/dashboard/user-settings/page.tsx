import UserSettingsClient from './user-settings'

export default async function UserSettingsPage() {
  return (
    <div className='flex flex-1 flex-col gap-4 px-8 py-4'>
      <UserSettingsClient />
    </div>
  )
}


