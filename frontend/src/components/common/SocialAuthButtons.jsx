import { useEffect, useRef, useState } from 'react';
import { initializeGoogleButton, requestFacebookAccessToken } from '../../services/socialAuth.js';

export default function SocialAuthButtons({
  disabled = false,
  googleText = 'continue_with',
  onFacebookAccessToken,
  onGoogleCredential,
}) {
  const googleButtonRef = useRef(null);
  const googleCallbackRef = useRef(onGoogleCredential);
  const facebookCallbackRef = useRef(onFacebookAccessToken);
  const disabledRef = useRef(disabled);
  const [facebookError, setFacebookError] = useState('');
  const [googleError, setGoogleError] = useState('');

  useEffect(() => {
    googleCallbackRef.current = onGoogleCredential;
  }, [onGoogleCredential]);

  useEffect(() => {
    facebookCallbackRef.current = onFacebookAccessToken;
  }, [onFacebookAccessToken]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    let cancelled = false;

    setGoogleError('');

    initializeGoogleButton({
      buttonElement: googleButtonRef.current,
      text: googleText,
      onCredential: (credential) => {
        if (!disabledRef.current) {
          Promise.resolve(googleCallbackRef.current?.(credential)).catch((error) => {
            setGoogleError(error.message || 'Kh\u00f4ng th\u1ec3 \u0111\u0103ng nh\u1eadp b\u1eb1ng Google.');
          });
        }
      },
    }).catch((error) => {
      if (!cancelled) {
        setGoogleError(error.message || 'Kh\u00f4ng th\u1ec3 \u0111\u0103ng nh\u1eadp b\u1eb1ng Google.');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [googleText]);

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
      <div className="auth-social-grid">
        <div className="google-signin-host" ref={googleButtonRef}>
          {googleError && (
            <button type="button" disabled>
              <span className="google-mark">G</span>
              Google
            </button>
          )}
        </div>
        <button type="button" onClick={handleFacebookLogin} disabled={disabled}>
          <span className="facebook-mark">f</span>
          Facebook
        </button>
      </div>

      {(facebookError || googleError) && <p className="form-error">{facebookError || googleError}</p>}
    </>
  );
}
