import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { User, Bell, Shield, CreditCard, Loader2, Check, AlertCircle, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { useTourContext } from '@/contexts/TourContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { billingService } from '@/services/billing'

export function AccountSettingsPage() {
  const { user, updateUser } = useAuth()
  const { resetAllTours } = useTourContext()
  const { billingStatus, loading: billingLoading, refreshBillingStatus } = useSubscription()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notifications: true,
    emailNotifications: true
  })

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  const [portalLoading, setPortalLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Section-specific saving states
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)

  // Section-specific error states
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [notificationError, setNotificationError] = useState<string | null>(null)

  // Section-specific success states
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null)
  const [tourResetSuccess, setTourResetSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || '',
        email: user.email || '',
        notifications: (user.user_metadata?.notifications_enabled as boolean) ?? true,
        emailNotifications: (user.user_metadata?.email_notifications_enabled as boolean) ?? true
      })
    }
  }, [user])

  const handleSaveProfile = async () => {
    setProfileError(null)
    setProfileSuccess(null)
    setSavingProfile(true)

    try {
      const updates: { email?: string; data?: Record<string, unknown> } = {}

      // Only update email if it changed
      if (formData.email !== user?.email) {
        updates.email = formData.email
      }

      // Always include full_name in data updates
      updates.data = {
        ...user?.user_metadata,
        full_name: formData.name
      }

      await updateUser(updates)

      if (updates.email && updates.email !== user?.email) {
        setProfileSuccess('Profile updated! Please check your email to confirm your new email address.')
      } else {
        setProfileSuccess('Profile updated successfully!')
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUpdatePassword = async () => {
    setPasswordError(null)
    setPasswordSuccess(null)

    // Validation
    if (!passwordData.newPassword) {
      setPasswordError('Please enter a new password')
      return
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setSavingPassword(true)

    try {
      await updateUser({ password: passwordData.newPassword })
      setPasswordSuccess('Password updated successfully!')
      setPasswordData({ newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSaveNotifications = async () => {
    setNotificationError(null)
    setNotificationSuccess(null)
    setSavingNotifications(true)

    try {
      await updateUser({
        data: {
          ...user?.user_metadata,
          notifications_enabled: formData.notifications,
          email_notifications_enabled: formData.emailNotifications
        }
      })
      setNotificationSuccess('Notification preferences saved!')
    } catch (err) {
      setNotificationError(err instanceof Error ? err.message : 'Failed to save notification preferences')
    } finally {
      setSavingNotifications(false)
    }
  }

  // Check for checkout success
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setSuccessMessage('Your subscription has been activated! Thank you for subscribing.')
      // Refresh billing status to get updated entitlements
      refreshBillingStatus()
      // Clear the URL parameter
      window.history.replaceState({}, '', '/account')
    }
  }, [searchParams, refreshBillingStatus])

  const handleManageBilling = async () => {
    try {
      setPortalLoading(true)
      await billingService.redirectToPortal()
    } catch (err) {
      console.error('Failed to open billing portal:', err)
      setPortalLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'trialing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Account Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your account preferences and information</p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 dark:text-green-400 hover:text-green-800"
          >
            &times;
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Billing Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Subscription & Billing</h2>
          </div>

          {billingLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-500">Loading billing information...</span>
            </div>
          ) : billingStatus ? (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Current Plan</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 capitalize">
                    {billingStatus.entitlements?.plan_name ?? billingStatus.plan_name}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(billingStatus.status)}`}>
                  {billingStatus.status === 'trialing' ? 'Trial' : billingStatus.status}
                </span>
              </div>

              {/* Subscription Details */}
              {billingStatus.has_subscription && (
                <div className="grid md:grid-cols-2 gap-4">
                  {billingStatus.trial_end && billingStatus.status === 'trialing' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-600 dark:text-blue-400">Trial Ends</p>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        {formatDate(billingStatus.trial_end)}
                      </p>
                    </div>
                  )}
                  {billingStatus.current_period_end && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {billingStatus.cancel_at_period_end ? 'Access Until' : 'Next Billing Date'}
                      </p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {formatDate(billingStatus.current_period_end)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Cancellation Warning */}
              {billingStatus.cancel_at_period_end && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 dark:text-yellow-200 font-medium">Subscription Cancelled</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Your subscription will end on {formatDate(billingStatus.current_period_end)}.
                      You can reactivate anytime before then.
                    </p>
                  </div>
                </div>
              )}

              {/* Usage Stats */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">This Month's Usage</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border dark:border-slate-600 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Resume Tailors</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {billingStatus.usage.tailors_used}
                        {billingStatus.entitlements.tailors_per_month === -1
                          ? ' / Unlimited'
                          : ` / ${billingStatus.entitlements.tailors_per_month}`}
                      </span>
                    </div>
                    {billingStatus.entitlements.tailors_per_month !== -1 && (
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (billingStatus.usage.tailors_used / billingStatus.entitlements.tailors_per_month) * 100)}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-4 border dark:border-slate-600 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Job Matches</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {billingStatus.usage.matches_used}
                        {billingStatus.entitlements.matches_per_month === -1
                          ? ' / Unlimited'
                          : ` / ${billingStatus.entitlements.matches_per_month}`}
                      </span>
                    </div>
                    {billingStatus.entitlements.matches_per_month !== -1 && (
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (billingStatus.usage.matches_used / billingStatus.entitlements.matches_per_month) * 100)}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t dark:border-slate-600">
                {billingStatus.has_subscription ? (
                  <Button onClick={handleManageBilling} disabled={portalLoading}>
                    {portalLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opening Portal...
                      </>
                    ) : (
                      'Manage Subscription'
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/pricing')}>
                    View Plans
                  </Button>
                )}
                {(billingStatus.entitlements?.plan_name ?? billingStatus.plan_name) !== 'premium' && billingStatus.has_subscription && (
                  <Button variant="outline" onClick={() => navigate('/pricing')}>
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                You're currently on the Free plan
              </p>
              <Button onClick={() => navigate('/pricing')}>
                View Plans
              </Button>
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Profile Information</h2>
          </div>
          <div className="space-y-4">
            {profileError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{profileError}</p>
              </div>
            )}
            {profileSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">{profileSuccess}</p>
              </div>
            )}
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
                disabled={savingProfile}
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
                disabled={savingProfile}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Changing your email will require confirmation via email.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Security</h2>
          </div>
          <div className="space-y-4">
            {passwordError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                disabled={savingPassword}
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
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                disabled={savingPassword}
              />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleUpdatePassword} disabled={savingPassword}>
                {savingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Notifications</h2>
          </div>
          <div className="space-y-4">
            {notificationError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{notificationError}</p>
              </div>
            )}
            {notificationSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">{notificationSuccess}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Enable Notifications
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">Receive notifications about your resume processing</p>
              </div>
              <Checkbox
                id="notifications"
                checked={formData.notifications}
                onCheckedChange={(checked) => setFormData({ ...formData, notifications: checked as boolean })}
                disabled={savingNotifications}
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
                disabled={savingNotifications}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveNotifications} disabled={savingNotifications}>
                {savingNotifications ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Guided Tour */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <RotateCcw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Guided Tour</h2>
          </div>
          <div className="space-y-4">
            {tourResetSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">{tourResetSuccess}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Reset Guide</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Replay the guided tour to revisit tips and features across all pages
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  resetAllTours()
                  setTourResetSuccess('Guided tour has been reset! Visit any page to start the tour again.')
                  setTimeout(() => setTourResetSuccess(null), 5000)
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Guide
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
