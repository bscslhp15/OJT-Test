import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpDownIcon, UserIcon } from '@heroicons/react/24/outline';
import AuthContext from '../context/auth-context';
import { applyAdminUserBulkAction, fetchAdminUsers } from '../services/api';

const userRole = (user) => user?.role || (user?.isAdmin ? 'Administrator' : 'Author');

const UserTable = ({ users, selectedIds, onToggleUser, onToggleAll }) => {
  const checkboxClass = 'h-4 w-4 rounded border-[#B8C0B8] text-[#16803C] focus:ring-[#22C55E]';
  const headerClass = 'whitespace-nowrap px-3 py-3 text-left font-medium';
  const allSelected = users.length > 0 && users.every((listedUser) => selectedIds.includes(String(listedUser.id)));

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#C8D0C8] bg-white">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm text-[#1E1E1E]">
        <thead>
          <tr className="border-b border-[#C8D0C8] text-[#384238]">
            <th className={`${headerClass} w-10`}><input type="checkbox" aria-label="Select all users" checked={allSelected} onChange={(event) => onToggleAll(event.target.checked)} className={checkboxClass} /></th>
            <th className={headerClass}>
              <span className="inline-flex items-center gap-1">Username <ChevronUpDownIcon className="h-3.5 w-3.5 text-[#899389]" /></span>
            </th>
            <th className={headerClass}>Name</th>
            <th className={headerClass}>
              <span className="inline-flex items-center gap-1">Email <ChevronUpDownIcon className="h-3.5 w-3.5 text-[#899389]" /></span>
            </th>
            <th className={headerClass}>Role</th>
            <th className={`${headerClass} text-center`}>Posts</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan="6" className="px-3 py-8 text-center text-[#69736A]">No users found.</td></tr>
          ) : users.map((listedUser, index) => {
            const fullName = [listedUser.firstName, listedUser.lastName].filter(Boolean).join(' ').trim();
            return (
              <tr key={listedUser.id} className={`group border-b border-[#DCE5DC] ${index % 2 ? 'bg-[#F7FAF7]' : 'bg-white'} hover:bg-[#F0F8F0]`}>
                <td className="px-3 py-3 align-top"><input type="checkbox" aria-label={`Select ${listedUser.username || listedUser.email}`} checked={selectedIds.includes(String(listedUser.id))} onChange={(event) => onToggleUser(listedUser.id, event.target.checked)} className={checkboxClass} /></td>
                <td className="px-3 py-3 align-top">
                  <div className="flex items-center gap-2.5">
                    {listedUser.profile_photo
                      ? <img src={listedUser.profile_photo} alt="" className="h-8 w-8 shrink-0 object-cover" />
                      : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#DCE5DC] text-[#526052]"><UserIcon className="h-6 w-6" aria-hidden="true" /></span>}
                    <a href="#users" onClick={(event) => event.preventDefault()} className="font-semibold text-[#2271B1] hover:text-[#16803C]">{listedUser.username || listedUser.email?.split('@')[0] || 'User'}</a>
                  </div>
                </td>
                <td className="px-3 py-3 align-top text-[#526052]">{fullName || '—'}</td>
                <td className="px-3 py-3 align-top"><a href={`mailto:${listedUser.email || ''}`} className="text-[#2271B1] hover:text-[#16803C]">{listedUser.email || '—'}</a></td>
                <td className="px-3 py-3 align-top text-[#526052]">{userRole(listedUser)}</td>
                <td className="px-3 py-3 text-right align-top"><a href="#users" onClick={(event) => event.preventDefault()} className="text-[#2271B1] hover:text-[#16803C] hover:underline">{listedUser.postCount || 0}</a></td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-[#C8D0C8] text-[#384238]">
            <th className={`${headerClass} w-10`}><input type="checkbox" aria-label="Select all users" checked={allSelected} onChange={(event) => onToggleAll(event.target.checked)} className={checkboxClass} /></th>
            <th className={headerClass}><span className="inline-flex items-center gap-1">Username <ChevronUpDownIcon className="h-3.5 w-3.5 text-[#899389]" /></span></th>
            <th className={headerClass}>Name</th>
            <th className={headerClass}><span className="inline-flex items-center gap-1">Email <ChevronUpDownIcon className="h-3.5 w-3.5 text-[#899389]" /></span></th>
            <th className={headerClass}>Role</th>
            <th className={`${headerClass} text-right`}>Posts</th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const AdminUsers = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [bulkActionBusy, setBulkActionBusy] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const totalUsers = users.length;
  const roles = [...new Set(users.map(userRole))];
  const usersPerPage = 20;
  const pageCount = Math.max(1, Math.ceil(totalUsers / usersPerPage));
  const displayedPage = Math.min(currentPage, pageCount);
  const pageUsers = users.slice((displayedPage - 1) * usersPerPage, displayedPage * usersPerPage);
  const controlClass = 'h-9 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm text-[#1E1E1E] focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]';
  const buttonClass = 'h-9 rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]';

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  useEffect(() => {
    let isMounted = true;
    const authKey = user?.authKey || user?.auth_key;
    if (!authKey) {
      setLoadError('Your admin session is missing. Please sign in again.');
      setLoading(false);
      return () => { isMounted = false; };
    }

    fetchAdminUsers(authKey)
      .then(({ data }) => {
        if (isMounted) setUsers(Array.isArray(data?.users) ? data.users : []);
      })
      .catch((error) => {
        if (isMounted) setLoadError(error.response?.data?.message || 'Could not load users. Please try again.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [user?.authKey, user?.auth_key]);

  const toggleUser = (userId, checked) => {
    const id = String(userId);
    setSelectedIds((current) => checked
      ? [...new Set([...current, id])]
      : current.filter((selectedId) => selectedId !== id));
  };

  const toggleAllUsers = (checked) => {
    setSelectedIds(checked ? users.map((listedUser) => String(listedUser.id)) : []);
  };

  const applyBulkAction = async () => {
    if (!bulkAction) {
      setActionError('Choose a bulk action first.');
      setActionNotice('');
      return;
    }
    if (selectedIds.length === 0) {
      setActionError('Select at least one user first.');
      setActionNotice('');
      return;
    }
    if (bulkAction === 'delete' && !window.confirm(`Delete ${selectedIds.length} selected user${selectedIds.length === 1 ? '' : 's'} and their posts? This cannot be undone.`)) {
      return;
    }

    const authKey = user?.authKey || user?.auth_key;
    setBulkActionBusy(true);
    setActionError('');
    setActionNotice('');
    try {
      const { data } = await applyAdminUserBulkAction(authKey, { action: bulkAction, userIds: selectedIds });
      if (bulkAction === 'delete') {
        const deletedIds = new Set((data.deletedIds || selectedIds).map(String));
        setUsers((current) => current.filter((listedUser) => !deletedIds.has(String(listedUser.id))));
        setSelectedIds((current) => current.filter((id) => !deletedIds.has(id)));
        setActionNotice(`${data.deletedCount} user${data.deletedCount === 1 ? '' : 's'} and their posts deleted.`);
      } else {
        const sentCount = Number(data.sentCount || 0);
        const failedCount = Number(data.failedCount || 0);
        setActionNotice(`${sentCount} password reset email${sentCount === 1 ? '' : 's'} sent${failedCount ? `; ${failedCount} failed` : ''}.`);
        setSelectedIds([]);
      }
      setBulkAction('');
    } catch (error) {
      setActionError(error.response?.data?.message || 'The bulk action could not be completed.');
    } finally {
      setBulkActionBusy(false);
    }
  };

  const applyRoleChange = async () => {
    if (!selectedRole) {
      setActionError('Choose a role first.');
      setActionNotice('');
      return;
    }
    if (selectedIds.length === 0) {
      setActionError('Select at least one user first.');
      setActionNotice('');
      return;
    }

    const authKey = user?.authKey || user?.auth_key;
    setBulkActionBusy(true);
    setActionError('');
    setActionNotice('');
    try {
      const { data } = await applyAdminUserBulkAction(authKey, {
        action: 'change-role',
        userIds: selectedIds,
        role: selectedRole
      });
      const updatedIds = new Set((data.updatedIds || selectedIds).map(String));
      const roleLabel = selectedRole === 'administrator' ? 'Administrator' : 'Author';
      setUsers((current) => current.map((listedUser) => updatedIds.has(String(listedUser.id))
        ? { ...listedUser, role: roleLabel, isAdmin: selectedRole === 'administrator' }
        : listedUser));
      setSelectedIds([]);
      setSelectedRole('');
      setActionNotice(`${data.updatedCount} user${data.updatedCount === 1 ? '' : 's'} updated to ${roleLabel}.`);
    } catch (error) {
      setActionError(error.response?.data?.message || 'The role change could not be completed.');
    } finally {
      setBulkActionBusy(false);
    }
  };

  const UserControls = ({ position }) => (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`${position}-user-bulk-action`}>Bulk actions</label>
      <select id={`${position}-user-bulk-action`} value={bulkAction} onChange={(event) => setBulkAction(event.target.value)} className={`${controlClass} min-w-40`}>
        <option value="">Bulk actions</option>
        <option value="delete">Delete</option>
        <option value="send-password-reset">Send password reset</option>
      </select>
      <button type="button" onClick={applyBulkAction} disabled={bulkActionBusy} className={`${buttonClass} disabled:cursor-wait disabled:opacity-60`}>{bulkActionBusy ? 'Working...' : 'Apply'}</button>
      <label className="sr-only" htmlFor={`${position}-user-role-action`}>Change role to</label>
      <select id={`${position}-user-role-action`} value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)} className={`${controlClass} min-w-48`}>
        <option value="">Change role to...</option>
        <option value="author">Author</option>
        <option value="administrator">Administrator</option>
      </select>
      <button type="button" onClick={applyRoleChange} disabled={bulkActionBusy} className={`${buttonClass} disabled:cursor-wait disabled:opacity-60`}>Change</button>
    </div>
  );

  return (
    <main className="min-h-full bg-[#F7FAF7] px-4 py-6 text-[#1E1E1E] md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-normal">Users</h1>
          <Link to="/testsite/admin/users/add" className="inline-flex h-9 items-center rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]">Add User</Link>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#69736A]">
          <a href="#all" onClick={(event) => event.preventDefault()} className="font-semibold text-[#1E1E1E]">All ({totalUsers})</a>
          {roles.map((role) => (
            <span key={role} className="contents">
              <span aria-hidden="true">|</span>
              <a href={`#${role.toLowerCase()}`} onClick={(event) => event.preventDefault()} className="text-[#2271B1] hover:text-[#22C55E]">
                {role} ({users.filter((listedUser) => userRole(listedUser) === role).length})
              </a>
            </span>
          ))}
        </div>
        <form onSubmit={(event) => event.preventDefault()} className="flex w-full gap-2 lg:w-auto">
          <label className="sr-only" htmlFor="search-users">Search users</label>
          <input id="search-users" type="search" placeholder="Search users..." className={`${controlClass} min-w-0 flex-1 px-3 lg:w-64`} />
          <button type="submit" className={`${buttonClass} shrink-0`}>Search Users</button>
        </form>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <UserControls position="top" />
        <span className="text-xs text-[#69736A]">{totalUsers} {totalUsers === 1 ? 'item' : 'items'}</span>
      </div>

      {(actionError || actionNotice) && <div role={actionError ? 'alert' : 'status'} className={`mb-2 rounded-xl border-l-4 bg-white px-3 py-2 text-sm ${actionError ? 'border-red-600 text-red-700' : 'border-[#22C55E] text-[#176B34]'}`}>{actionError || actionNotice}</div>}

      {loading ? <div className="rounded-xl border border-[#C8D0C8] bg-white px-3 py-5 text-sm text-[#69736A]">Loading users...</div>
        : loadError ? <div role="alert" className="rounded-xl border-l-4 border-red-600 bg-white px-3 py-2 text-sm text-red-700">{loadError}</div>
          : <UserTable users={pageUsers} selectedIds={selectedIds} onToggleUser={toggleUser} onToggleAll={toggleAllUsers} />}

      <div className="relative mt-2 flex flex-wrap items-center justify-between gap-3">
        <UserControls position="bottom" />
        <span className="text-xs text-[#69736A]">{totalUsers} {totalUsers === 1 ? 'item' : 'items'}</span>
        {totalUsers > usersPerPage && (
          <nav aria-label="User pagination" className="flex w-full items-center justify-center gap-2 sm:absolute sm:left-1/2 sm:w-auto sm:-translate-x-1/2">
            <button type="button" onClick={() => setCurrentPage(displayedPage - 1)} disabled={displayedPage === 1} className="inline-flex h-8 items-center gap-1 rounded-md bg-[#5B7DBB] px-2.5 text-xs font-semibold text-white hover:bg-[#496BA8] disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden="true" /> Prev 20
            </button>
            <button type="button" onClick={() => setCurrentPage(displayedPage + 1)} disabled={displayedPage === pageCount} className="inline-flex h-8 items-center gap-1 rounded-md bg-[#5B7DBB] px-2.5 text-xs font-semibold text-white hover:bg-[#496BA8] disabled:cursor-not-allowed disabled:opacity-40">
              Next 20 <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>
    </main>
  );
};

export default AdminUsers;