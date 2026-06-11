import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import { requestFacebookAccessToken, requestGoogleCredential } from '../../services/socialAuth.js';

export default function SocialAuthButtons({
  disabled = false,
  onFacebookAccessToken,
  onGoogleCredential,
}) {
  const googleCallbackRef = useRef(onGoogleCredential);
  const facebookCallbackRef = useRef(onFacebookAccessToken);
  const [facebookError, setFacebookError] = useState('');
  const [googleError, setGoogleError] = useState('');

  useEffect(() => {
    googleCallbackRef.current = onGoogleCredential;
  }, [onGoogleCredential]);

  useEffect(() => {
    facebookCallbackRef.current = onFacebookAccessToken;
  }, [onFacebookAccessToken]);

  async function handleGoogleLogin() {
    if (disabled) {
      return;
    }

    setGoogleError('');

    try {
      const credential = await requestGoogleCredential();
      await googleCallbackRef.current?.(credential);
    } catch (error) {
      setGoogleError(error.message || 'Không thể đăng nhập bằng Google.');
    }
  }

  async function handleFacebookLogin() {
    if (disabled) {
      return;
    }

    setFacebookError('');

    try {
      const accessToken = await requestFacebookAccessToken();
      await facebookCallbackRef.current?.(accessToken);
    } catch (error) {
      setFacebookError(error.message || 'Kh\u00f4ng th\u1ec3 \u0111\u0103ng nh\u1eadp b\u1eb1ng Facebook.');
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Button fullWidth variant="outline" onClick={handleGoogleLogin} disabled={disabled}>
          <span className="google-mark" aria-hidden="true">G</span>
          Google
        </Button>
        <Button fullWidth variant="outline" onClick={handleFacebookLogin} disabled={disabled}>
          <span className="facebook-mark" aria-hidden="true" />
          Facebook
        </Button>
      </div>

      {(facebookError || googleError) && <p className="form-error">{facebookError || googleError}</p>}
    </>
  );
}
