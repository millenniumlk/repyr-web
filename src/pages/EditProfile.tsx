import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, User, Lock, Mail, Camera, Loader2, Trash2, Shield, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

const ActionRow = ({ icon: Icon, title, onClick, isDestructive, isLast, expandable, expanded, disabled, isSpinning }: any) => (
  <Button 
    variant="ghost"
    onClick={onClick}
    disabled={disabled}
    className={`w-full h-auto flex items-center justify-between px-5 py-4 rounded-none hover:bg-gray-50/50 group ${!isLast ? 'border-b border-gray-100' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <div className="flex items-center">
      <div className="mr-4">
        <Icon className={`w-[22px] h-[22px] ${isDestructive ? 'text-red-500' : 'text-primary'} ${isSpinning ? 'animate-spin' : ''}`} strokeWidth={2.2} />
      </div>
      <span className={`text-[16px] tracking-tight font-medium ${isDestructive ? 'text-red-500' : 'text-gray-900'}`}>
        {title}
      </span>
    </div>
    {expandable && (
      <div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" strokeWidth={2} />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
        )}
      </div>
    )}
  </Button>
);

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [originalFullName, setOriginalFullName] = useState('');
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
  

  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
        if (data) {
          setFullName(data.full_name || '');
          setOriginalFullName(data.full_name || '');
          setAvatarUrl(data.avatar_url);
          setOriginalAvatarUrl(data.avatar_url);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const hasChanges = (fullName !== originalFullName) || (avatarUrl !== originalAvatarUrl) || (avatarFile !== null);
  const isValidName = fullName.trim().length >= 2;
  const canSaveProfile = hasChanges && isValidName && !saving;
  
  const passwordsMatch = newPassword === confirmPassword;
  const isValidPassword = newPassword.length >= 6;
  const canSavePassword = newPassword.length > 0 && passwordsMatch && isValidPassword && !saving;

  const handleSaveProfile = async () => {
    if (!canSaveProfile) return;
    setSaving(true);
    setError('');

    try {
      let finalAvatarUrl = avatarUrl;
      
      if (avatarFile && user?.id) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);
          
        if (uploadError) {
          throw new Error('Failed to upload image. Make sure an "avatars" storage bucket exists in Supabase. Details: ' + uploadError.message);
        }
        
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        finalAvatarUrl = data.publicUrl;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, avatar_url: finalAvatarUrl })
        .eq('id', user?.id);
      
      if (profileError) throw profileError;

      setOriginalFullName(fullName);
      setOriginalAvatarUrl(finalAvatarUrl);
      setAvatarFile(null);
      navigate('/settings');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    
    setSaving(true);
    setIsDeleting(true);
    try {
      // Attempt to delete profile data
      await supabase.from('profiles').delete().eq('id', user?.id);
      
      // Attempt to call RPC if it exists
      await supabase.rpc('delete_user');
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (err) {
      console.error("Error deleting account:", err);
      // Fallback: still sign out
      await supabase.auth.signOut();
      navigate('/auth');
    } finally {
      setSaving(false);
      setIsDeleting(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!canSavePassword) return;
    setSaving(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw authError;

      setShowPasswordEdit(false);
      setNewPassword('');
      setConfirmPassword('');
      alert('Password updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const tempUrl = URL.createObjectURL(file);
    setAvatarUrl(tempUrl);
    setAvatarFile(file);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayInitial = fullName ? fullName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
    <div className="max-w-3xl mx-auto pb-24 relative min-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-2 mt-2">
        <div className="flex items-center gap-4">
          <Button 
            variant="secondary"
            size="icon"
            onClick={() => navigate('/settings')}
            className="bg-gray-100 hover:bg-gray-200"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-black tracking-tight leading-tight">Edit Profile</h1>
        </div>
        {hasChanges && (
          <Button
            variant="ghost"
            onClick={handleSaveProfile}
            disabled={!canSaveProfile}
            isLoading={saving}
            className={`font-bold text-[16px] px-4 py-2 hover:bg-transparent ${canSaveProfile ? 'text-primary' : 'text-gray-300'}`}
          >
            Save
          </Button>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Avatar Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="items-center mb-12 flex flex-col"
        >
          <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-28 h-28 rounded-full border-[4px] border-white items-center justify-center overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.05)] flex ${avatarUrl ? 'bg-gray-50' : 'bg-blue-50 border-blue-100'}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary text-[40px] font-black pt-1 leading-[44px]">
                  {displayInitial}
                </span>
              )}
            </div>
            
            <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary border-[4px] border-white flex items-center justify-center z-20 group-hover:bg-blue-700 transition-colors">
              <Camera className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
            </div>
          </div>
          
          {avatarUrl && (
            <Button 
              variant="destructive"
              size="sm"
              onClick={() => {
                setAvatarUrl(null);
                setAvatarFile(null);
              }}
              className="mt-4 bg-red-50 text-red-500 text-[13px] font-medium hover:bg-red-100 hover:text-red-600 rounded-full px-4 py-1.5 h-auto"
            >
              Remove Photo
            </Button>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </motion.div>

        {/* Group 1: Personal Details */}
        <div className="mb-7">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-3 ml-3">
            Personal Details
          </h4>
          <div className="bg-gray-50 rounded-[28px] overflow-hidden border border-gray-100">
            {/* Full Name Row */}
            <div className={`px-5 py-2 border-b border-gray-100 flex items-center ${(!isValidName && fullName.length > 0) ? 'bg-red-50' : 'bg-transparent'}`}>
              <div className="mr-4">
                <User className={`w-[22px] h-[22px] ${(!isValidName && fullName.length > 0) ? "text-red-500" : "text-primary"}`} strokeWidth={2.2} />
              </div>
              <div className="flex-1 py-1">
                <label className={`block text-[12px] font-bold mb-1 uppercase tracking-wider ${(!isValidName && fullName.length > 0) ? 'text-red-500' : 'text-gray-400'}`}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full bg-transparent text-gray-900 text-[16px] font-medium py-0.5 outline-none placeholder:text-gray-400"
                  placeholder="Enter your full name"
                />
                {(!isValidName && fullName.length > 0) && (
                  <p className="text-red-500 text-[12px] mt-1 font-medium">Name must be at least 2 characters.</p>
                )}
              </div>
            </div>
            
            {/* Email Row */}
            <div className="px-5 py-2 flex items-center opacity-70">
              <div className="mr-4">
                <Mail className="w-[22px] h-[22px] text-primary" strokeWidth={2.2} />
              </div>
              <div className="flex-1 py-1">
                <label className="block text-[12px] font-bold mb-1 text-gray-400 uppercase tracking-wider">Email Address</label>
                <p className="text-gray-900 text-[16px] font-medium py-0.5">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Group 2: Password Security */}
        <div className="mb-7">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-3 ml-3">
            Security
          </h4>
          {!showPasswordEdit ? (
            <div className="bg-gray-50 rounded-[28px] overflow-hidden border border-gray-100">
            <ActionRow 
              icon={Lock} 
              title="Change Password" 
              onClick={() => setShowPasswordEdit(!showPasswordEdit)}
              isLast={true}
              expandable={true}
              expanded={showPasswordEdit}
            />
          </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-[28px] overflow-hidden animate-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-primary mr-2.5" strokeWidth={2.2} />
                  <span className="text-gray-900 font-bold text-[15px]">Update Password</span>
                </div>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPasswordEdit(false)}
                  className="h-8 w-8 rounded-full bg-gray-200/80 hover:bg-gray-300"
                >
                  <X className="w-4 h-4 text-gray-600" strokeWidth={3} />
                </Button>
              </div>

              <div className="px-5 py-4 border-b border-gray-100 bg-white/50">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full bg-transparent text-gray-900 text-[16px] font-medium py-1 outline-none placeholder:text-gray-400"
                  placeholder="New Password (Min 6 chars)"
                />
                {(newPassword.length > 0 && !isValidPassword) && (
                  <p className="text-red-500 text-[12px] mt-1.5 font-medium">Password must be at least 6 characters.</p>
                )}
              </div>

              <div className="px-5 py-4 bg-white/50">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full bg-transparent text-gray-900 text-[16px] font-medium py-1 outline-none placeholder:text-gray-400"
                  placeholder="Confirm New Password"
                />
                {(confirmPassword.length > 0 && !passwordsMatch) && (
                  <p className="text-red-500 text-[12px] mt-1.5 font-medium">Passwords do not match.</p>
                )}
              </div>

              <div className="p-4 border-t border-gray-100">
                <Button 
                  onClick={handleUpdatePassword}
                  disabled={!canSavePassword}
                  isLoading={saving && newPassword.length > 0}
                  className="w-full rounded-[20px]"
                >
                  Update Password
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="mt-8 mb-12">
          <div className="bg-gray-50 rounded-[28px] overflow-hidden border border-gray-100">
            <ActionRow 
              icon={isDeleting ? Loader2 : Trash2} 
              title={isDeleting ? "Deleting..." : "Delete Account"} 
              onClick={handleDeleteAccount}
              isDestructive={true}
              isLast={true}
              disabled={saving}
              isSpinning={isDeleting}
            />
          </div>
          <p className="text-center text-[13px] mt-4 px-4 leading-snug text-gray-400 font-medium">
             Once you delete your account, your diagnostic history will be permanently erased.
          </p>
        </div>

      </div>
    </div>
  );
};

export default EditProfile;
