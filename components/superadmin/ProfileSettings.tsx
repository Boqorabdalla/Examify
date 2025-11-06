
import React, { useState } from 'react';
import { User } from '../../types';

interface ProfileSettingsProps {
    user: User;
    onUpdateCredentials: (userId: string, newUsername: string, newPassword_provided: string) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdateCredentials }) => {
    const [username, setUsername] = useState(user.username);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (password && password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        if (password && password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
            return;
        }

        // Use new password if provided, otherwise keep the old one (which is already in the user object in App state)
        const finalPassword = password || user.password;

        onUpdateCredentials(user.id, username, finalPassword);

        setMessage({ type: 'success', text: 'Your profile has been updated successfully!' });
        setPassword('');
        setConfirmPassword('');

        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
                <h3 className="text-xl font-semibold text-amber-400 mb-4">Profile Settings</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="profile-username" className="block text-sm font-medium text-slate-300">Username</label>
                        <input
                            type="text"
                            id="profile-username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="profile-password" className="block text-sm font-medium text-slate-300">New Password (optional)</label>
                        <input
                            type="password"
                            id="profile-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                            placeholder="Leave blank to keep current password"
                        />
                    </div>
                     <div>
                        <label htmlFor="profile-confirm-password" className="block text-sm font-medium text-slate-300">Confirm New Password</label>
                        <input
                            type="password"
                            id="profile-confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                            disabled={!password}
                        />
                    </div>
                    
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-slate-900 bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500">
                            Save Changes
                        </button>
                    </div>
                </form>
                {message && (
                    <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ProfileSettings;
