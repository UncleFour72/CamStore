import {
  CheckCircle2,
  KeyRound,
  MapPin,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { uploadImage } from '../services/uploadService.js';
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
} from '../store/slices/addressSlice.js';
import { changePassword, getProfile, updateProfile } from '../store/slices/authSlice.js';

const emptyAddressForm = {
  full_name: '',
  phone: '',
  address_line: '',
  ward: '',
  district: '',
  city: '',
  is_default: false,
};

const emptyPasswordForm = {
  current_password: '',
  new_password: '',
};

const buildProfileForm = (user) => ({
  first_name: user?.first_name || '',
  last_name: user?.last_name || '',
  phone: user?.phone || '',
  avatar_url: user?.avatar_url || '',
});

const formatAddress = (address) => {
  return [address?.address_line, address?.ward, address?.district, address?.city].filter(Boolean).join(', ');
};

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, isLoading: authLoading, error: authError } = useSelector((state) => state.auth);
  const {
    addresses,
    isLoading: addressLoading,
    error: addressError,
  } = useSelector((state) => state.address);

  const [profileForm, setProfileForm] = useState(buildProfileForm(user));
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [profileMessage, setProfileMessage] = useState('');
  const [addressMessage, setAddressMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [avatarStatus, setAvatarStatus] = useState('');

  const displayName =
    user?.name || user?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email;

  const defaultAddress = useMemo(() => {
    return addresses.find((address) => address.is_default) || addresses[0] || null;
  }, [addresses]);

  useEffect(() => {
    dispatch(getProfile());
    dispatch(fetchAddresses());
  }, [dispatch]);

  useEffect(() => {
    setProfileForm(buildProfileForm(user));

    if (!editingAddressId) {
      setAddressForm((current) => ({
        ...current,
        full_name: current.full_name || displayName || '',
        phone: current.phone || user?.phone || '',
        is_default: addresses.length === 0,
      }));
    }
  }, [addresses.length, displayName, editingAddressId, user]);

  function updateProfileField(event) {
    setProfileMessage('');
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function updateAddressField(event) {
    const { checked, name, type, value } = event.target;
    setAddressMessage('');
    setAddressForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function updatePasswordField(event) {
    setPasswordMessage('');
    setPasswordForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function resetAddressForm() {
    setEditingAddressId(null);
    setAddressForm({
      ...emptyAddressForm,
      full_name: displayName || '',
      phone: user?.phone || '',
      is_default: addresses.length === 0,
    });
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileMessage('');

    try {
      await dispatch(updateProfile(profileForm)).unwrap();
      setProfileMessage('Ho so da duoc cap nhat.');
    } catch {
      // Redux state already carries the visible error.
    }
  }

  async function handleAvatarUpload(event) {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setAvatarStatus('Dang upload anh...');

    try {
      const uploaded = await uploadImage(file, 'camstore/avatars');
      setProfileForm((current) => ({
        ...current,
        avatar_url: uploaded.url,
      }));
      setAvatarStatus('Anh da san sang, bam Luu ho so de cap nhat.');
    } catch (error) {
      setAvatarStatus(error.response?.data?.message || 'Khong the upload anh.');
    } finally {
      input.value = '';
    }
  }

  async function handleAddressSubmit(event) {
    event.preventDefault();
    setAddressMessage('');

    try {
      if (editingAddressId) {
        await dispatch(updateAddress({ id: editingAddressId, data: addressForm })).unwrap();
        setAddressMessage('Dia chi da duoc cap nhat.');
      } else {
        await dispatch(createAddress(addressForm)).unwrap();
        setAddressMessage('Dia chi moi da duoc luu.');
      }

      resetAddressForm();
    } catch {
      // Redux state already carries the visible error.
    }
  }

  function handleEditAddress(address) {
    setAddressMessage('');
    setEditingAddressId(address.id);
    setAddressForm({
      full_name: address.full_name || '',
      phone: address.phone || '',
      address_line: address.address_line || '',
      ward: address.ward || '',
      district: address.district || '',
      city: address.city || '',
      is_default: Boolean(address.is_default),
    });
  }

  async function handleDeleteAddress(addressId) {
    setAddressMessage('');

    try {
      await dispatch(deleteAddress(addressId)).unwrap();
      await dispatch(fetchAddresses()).unwrap();
      setAddressMessage('Dia chi da duoc xoa.');
      resetAddressForm();
    } catch {
      // Redux state already carries the visible error.
    }
  }

  async function handleSetDefaultAddress(addressId) {
    setAddressMessage('');

    try {
      await dispatch(setDefaultAddress(addressId)).unwrap();
      setAddressMessage('Da dat dia chi mac dinh.');
    } catch {
      // Redux state already carries the visible error.
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordMessage('');

    try {
      await dispatch(changePassword(passwordForm)).unwrap();
      setPasswordForm(emptyPasswordForm);
      setPasswordMessage('Mat khau da duoc doi thanh cong.');
    } catch {
      // Redux state already carries the visible error.
    }
  }

  return (
    <main className="page">
      <section className="container profile-grid">
        <div className="profile-card">
          <div className="profile-avatar">
            {profileForm.avatar_url ? (
              <img src={profileForm.avatar_url} alt={displayName || 'Avatar'} />
            ) : (
              <UserRound size={38} />
            )}
          </div>
          <h1>{displayName || 'Khach hang CamStore'}</h1>
          <p>{user?.email || 'Tai khoan khach hang'}</p>
          <span className="status-pill">{user?.role === 'admin' ? 'Quan tri vien' : 'Khach hang'}</span>
          <div className="profile-actions">
            <Link className="button secondary" to="/orders">
              Xem lich su don
            </Link>
            {user?.role === 'admin' && (
              <Link className="button primary" to="/admin">
                Vao admin
              </Link>
            )}
          </div>
        </div>

        <div className="profile-panels">
          <section className="panel soft-panel">
            <div className="section-title-row">
              <UserRound size={24} />
              <h2>Thong tin ca nhan</h2>
            </div>

            <form className="form-grid" onSubmit={handleProfileSubmit}>
              <label>
                <span>Ho</span>
                <input
                  type="text"
                  name="first_name"
                  value={profileForm.first_name}
                  onChange={updateProfileField}
                  required
                />
              </label>
              <label>
                <span>Ten</span>
                <input
                  type="text"
                  name="last_name"
                  value={profileForm.last_name}
                  onChange={updateProfileField}
                  required
                />
              </label>
              <label>
                <span>So dien thoai</span>
                <input type="tel" name="phone" value={profileForm.phone} onChange={updateProfileField} />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={user?.email || ''} disabled />
              </label>
              <label className="span-2">
                <span>Anh dai dien</span>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} />
              </label>

              {avatarStatus && <p className="field-note span-2">{avatarStatus}</p>}
              {profileMessage && <p className="form-success span-2">{profileMessage}</p>}
              {authError && <p className="form-error span-2">{authError}</p>}

              <div className="profile-form-actions span-2">
                <button className="button primary" type="submit" disabled={authLoading}>
                  {authLoading ? 'Dang luu...' : 'Luu ho so'}
                </button>
              </div>
            </form>
          </section>

          <section className="panel soft-panel">
            <div className="section-title-row">
              <MapPin size={24} />
              <h2>Dia chi giao hang</h2>
            </div>

            {defaultAddress ? (
              <p>
                <strong>Mac dinh:</strong> {formatAddress(defaultAddress)}
              </p>
            ) : (
              <p>Chua co dia chi giao hang. Hay them dia chi dau tien de checkout nhanh hon.</p>
            )}

            <div className="address-list">
              {addresses.map((address) => (
                <article className="address-card" key={address.id}>
                  <div className="address-card-header">
                    <div>
                      <strong>{address.full_name}</strong>
                      <span>{address.phone}</span>
                    </div>
                    {address.is_default && (
                      <span className="status-pill">
                        <CheckCircle2 size={14} /> Mac dinh
                      </span>
                    )}
                  </div>
                  <p>{formatAddress(address)}</p>
                  <div className="address-actions">
                    <button className="button secondary" type="button" onClick={() => handleEditAddress(address)}>
                      Sua
                    </button>
                    {!address.is_default && (
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => handleSetDefaultAddress(address.id)}
                        disabled={addressLoading}
                      >
                        Dat mac dinh
                      </button>
                    )}
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => handleDeleteAddress(address.id)}
                      disabled={addressLoading}
                    >
                      <Trash2 size={15} /> Xoa
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <form className="form-grid" onSubmit={handleAddressSubmit}>
              <label>
                <span>Nguoi nhan</span>
                <input
                  type="text"
                  name="full_name"
                  value={addressForm.full_name}
                  onChange={updateAddressField}
                  required
                />
              </label>
              <label>
                <span>So dien thoai</span>
                <input type="tel" name="phone" value={addressForm.phone} onChange={updateAddressField} required />
              </label>
              <label className="span-2">
                <span>Dia chi</span>
                <input
                  type="text"
                  name="address_line"
                  value={addressForm.address_line}
                  onChange={updateAddressField}
                  required
                />
              </label>
              <label>
                <span>Phuong/Xa</span>
                <input type="text" name="ward" value={addressForm.ward} onChange={updateAddressField} required />
              </label>
              <label>
                <span>Quan/Huyen</span>
                <input
                  type="text"
                  name="district"
                  value={addressForm.district}
                  onChange={updateAddressField}
                  required
                />
              </label>
              <label>
                <span>Tinh/Thanh pho</span>
                <input type="text" name="city" value={addressForm.city} onChange={updateAddressField} required />
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={addressForm.is_default}
                  onChange={updateAddressField}
                />
                <span>Dat lam dia chi mac dinh</span>
              </label>

              {addressMessage && <p className="form-success span-2">{addressMessage}</p>}
              {addressError && <p className="form-error span-2">{addressError}</p>}

              <div className="profile-form-actions span-2">
                <button className="button primary" type="submit" disabled={addressLoading}>
                  {addressLoading ? 'Dang luu...' : editingAddressId ? 'Cap nhat dia chi' : 'Them dia chi'}
                </button>
                {editingAddressId && (
                  <button className="button secondary" type="button" onClick={resetAddressForm}>
                    Huy sua
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="panel soft-panel">
            <div className="section-title-row">
              <KeyRound size={24} />
              <h2>Bao mat tai khoan</h2>
            </div>
            <form className="form-grid" onSubmit={handlePasswordSubmit}>
              <label>
                <span>Mat khau hien tai</span>
                <input
                  type="password"
                  name="current_password"
                  value={passwordForm.current_password}
                  onChange={updatePasswordField}
                  autoComplete="current-password"
                  required
                />
              </label>
              <label>
                <span>Mat khau moi</span>
                <input
                  type="password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={updatePasswordField}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>

              {passwordMessage && <p className="form-success span-2">{passwordMessage}</p>}
              {authError && <p className="form-error span-2">{authError}</p>}

              <div className="profile-form-actions span-2">
                <button className="button primary" type="submit" disabled={authLoading}>
                  {authLoading ? 'Dang doi...' : 'Doi mat khau'}
                </button>
              </div>
            </form>
          </section>

          <section className="panel soft-panel">
            <div className="section-title-row">
              <ShieldCheck size={24} />
              <h2>Quyen loi bao hanh</h2>
            </div>
            <p>Ho tro tra cuu bao hanh theo don hang va thong tin tai khoan CamStore.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
