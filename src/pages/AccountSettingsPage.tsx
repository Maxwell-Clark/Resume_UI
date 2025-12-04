import { useState, useEffect } from 'react'
import { User, Bell, Shield } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function AccountSettingsPage() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notifications: true,
    emailNotifications: true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        email: user.email || '',
        notifications: true,
        emailNotifications: true
      })
      setLoading(false)
    }
  }, [user])

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Account Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your account preferences and information</p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Profile Information</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-slate-900">Security</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-sm font-medium text-slate-700">
                Current Password
              </Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="outline">Update Password</Button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications" className="text-sm font-medium text-slate-700">
                  Enable Notifications
                </Label>
                <p className="text-sm text-slate-500">Receive notifications about your resume processing</p>
              </div>
              <Checkbox
                id="notifications"
                checked={formData.notifications}
                onCheckedChange={(checked) => setFormData({ ...formData, notifications: checked as boolean })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Notifications
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">Receive email updates when your resume is ready</p>
              </div>
              <Checkbox
                id="email-notifications"
                checked={formData.emailNotifications}
                onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked as boolean })}
              />
            </div>
            <div className="flex justify-end">
              <Button>Save Preferences</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
