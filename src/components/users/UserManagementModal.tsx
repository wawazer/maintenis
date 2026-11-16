import React, { useState } from 'react';
import { X, Users, Shield, Check, AlertCircle } from 'lucide-react';
import { UserProfile, UserRole, WorkShift } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  onUpdateUserRole: (
    email: string,
    role: UserRole,
    spesialisasi?: string,
    shift?: string,
    status_aktif?: string
  ) => Promise<void>;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  onUpdateUserRole
}) => {
  const { user: currentUser } = useAuth();
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('PELAPOR');
  const [specialization, setSpecialization] = useState<string>('');
  const [shift, setShift] = useState<string>('Shift 1 (Pagi)');
  const [statusAktif, setStatusAktif] = useState<string>('Aktif');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const startEdit = (u: UserProfile) => {
    setEditingEmail(u.email);
    setSelectedRole(u.role);
    setSpecialization(u.spesialisasi || '');
    setShift(u.shift || 'Shift 1 (Pagi)');
    setStatusAktif(String(u.status_aktif) === 'true' || u.status_aktif === 'Aktif' ? 'Aktif' : 'Non-Aktif');
  };

  const handleSave = async (email: string) => {
    setIsSaving(true);
    try {
      await onUpdateUserRole(email, selectedRole, specialization, shift, statusAktif);
      setEditingEmail(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-purple-950 text-purple-400 border border-purple-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                  Kelola Pengguna & Hak Akses (Master_Users)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  RBAC Management
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Atur peran pelapor, teknisi, supervisor, dan shift operasional
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Nama & Email</th>
                  <th className="py-2.5 px-3">Role Akses</th>
                  <th className="py-2.5 px-3">Spesialisasi</th>
                  <th className="py-2.5 px-3">Shift</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map((u) => {
                  const isEditing = editingEmail === u.email;

                  return (
                    <tr key={u.user_id} className="hover:bg-slate-800/30">
                      {/* Name & Email */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={u.nama_lengkap}
                              className="w-7 h-7 rounded-full object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-mono font-bold text-slate-300 text-xs">
                              {u.nama_lengkap[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white">
                              {u.nama_lengkap}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                          >
                            <option value="PELAPOR">PELAPOR</option>
                            <option value="TEKNISI">TEKNISI</option>
                            <option value="SUPERVISOR">SUPERVISOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-block font-mono text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-950/60 border-purple-700 text-purple-300'
                                : u.role === 'SUPERVISOR'
                                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                                : u.role === 'TEKNISI'
                                ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                                : 'bg-sky-950/60 border-sky-700 text-sky-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        )}
                      </td>

                      {/* Spesialisasi */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            placeholder="Mekanik / Listrik / Operator"
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          />
                        ) : (
                          <span className="text-slate-300">{u.spesialisasi || '-'}</span>
                        )}
                      </td>

                      {/* Shift */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <select
                            value={shift}
                            onChange={(e) => setShift(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                          >
                            <option value="Shift 1 (Pagi)">Shift 1 (Pagi)</option>
                            <option value="Shift 2 (Sore)">Shift 2 (Sore)</option>
                            <option value="Shift 3 (Malam)">Shift 3 (Malam)</option>
                            <option value="Normal Day">Normal Day</option>
                          </select>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-400">
                            {u.shift || 'Shift 1 (Pagi)'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <select
                            value={statusAktif}
                            onChange={(e) => setStatusAktif(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                          >
                            <option value="Aktif">Aktif</option>
                            <option value="Non-Aktif">Non-Aktif</option>
                          </select>
                        ) : (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium ${
                              String(u.status_aktif) === 'true' || u.status_aktif === 'Aktif'
                                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                                : 'bg-rose-950/40 text-rose-300 border-rose-800'
                            }`}
                          >
                            {String(u.status_aktif) === 'true' || u.status_aktif === 'Aktif'
                              ? 'Aktif'
                              : 'Non-Aktif'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSave(u.email)}
                              disabled={isSaving}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px]"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingEmail(null)}
                              className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white font-mono text-[11px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(u)}
                            className="px-2.5 py-1 rounded border border-slate-700 hover:border-slate-600 bg-slate-800 text-slate-300 hover:text-white font-mono text-[11px]"
                          >
                            Ubah
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
