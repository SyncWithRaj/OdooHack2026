'use client';

import { useState } from 'react';
import { User, ShieldAlert, Key, Mail, Building2, Briefcase } from 'lucide-react';
import Button from '../shared/Button';
import toast from 'react-hot-toast';

export default function ProfileTab({ user }) {
  const [resetting, setResetting] = useState(false);

  const handleResetPassword = () => {
    // In a real app, this would trigger an API call to send a reset link
    // or open a modal to change the password directly.
    setResetting(true);
    setTimeout(() => {
      toast.success('Password reset link sent to your email.');
      setResetting(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-hairline pb-4">
        <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider flex items-center gap-2">
          <User className="w-6 h-6 text-accent" /> User Profile
        </h2>
        <p className="text-sm text-steel">
          Manage your personal information and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-white border border-hairline rounded-lg p-6 shadow-sm flex flex-col items-center text-center gap-4">
            {/* Default PFP */}
            <div className="w-32 h-32 rounded-full bg-accent/10 border-4 border-white shadow-md flex items-center justify-center text-accent relative overflow-hidden group">
              <User className="w-16 h-16" />
              <div className="absolute inset-0 bg-ink/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-white text-xs font-bold uppercase tracking-wider">Update Photo</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-ink">{user.name}</h3>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 mx-auto">
                {user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Security */}
        <div className="md:col-span-2 flex flex-col gap-8">
          {/* Identity Details */}
          <div className="bg-white border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-steel border-b border-hairline pb-2">
              Identity Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-steel uppercase flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </span>
                <span className="text-sm font-medium text-ink">{user.email}</span>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-steel uppercase flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> System Role
                </span>
                <span className="text-sm font-medium text-ink capitalize">{user.role.replace('_', ' ')}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-steel uppercase flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Department
                </span>
                <span className="text-sm font-medium text-ink">
                  {user.department ? user.department.name : 'No Department Assigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-status-lost/5 border border-status-lost/20 rounded-lg p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-status-lost flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Danger Zone
            </h3>
            <p className="text-xs text-steel">
              Security settings and destructive actions for your account.
            </p>

            <div className="flex items-center justify-between p-4 bg-white border border-status-lost/10 rounded-md mt-2">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-ink">Reset Password</span>
                <span className="text-xs text-steel">Send a secure link to your email to reset your password.</span>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleResetPassword} 
                icon={Key}
                loading={resetting}
              >
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
