const socialMessages = {
  loadFailed: 'Kh\u00f4ng th\u1ec3 t\u1ea3i th\u01b0 vi\u1ec7n \u0111\u0103ng nh\u1eadp m\u1ea1ng x\u00e3 h\u1ed9i.',
  googleNotConfigured: '\u0110\u0103ng nh\u1eadp Google ch\u01b0a \u0111\u01b0\u1ee3c c\u1ea5u h\u00ecnh.',
  googleNotReady: 'Google Identity Services ch\u01b0a s\u1eb5n s\u00e0ng.',
  facebookNotConfigured: '\u0110\u0103ng nh\u1eadp Facebook ch\u01b0a \u0111\u01b0\u1ee3c c\u1ea5u h\u00ecnh.',
  facebookNotReady: 'Facebook SDK ch\u01b0a s\u1eb5n s\u00e0ng.',
  facebookCancelled: 'B\u1ea1n \u0111\u00e3 h\u1ee7y \u0111\u0103ng nh\u1eadp Facebook.',
};

const loadScript = (id, src) => {
  const existing = document.getElementById(id);

  if (existing?.dataset.loaded === 'true') {
    return Promise.resolve();
  }

  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(socialMessages.loadFailed));
    document.head.appendChild(script);
  });
};

export const initializeGoogleButton = async ({ buttonElement, onCredential, text = 'continue_with' }) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error(socialMessages.googleNotConfigured);
  }

  await loadScript('google-identity-services', 'https://accounts.google.com/gsi/client');

  if (!window.google?.accounts?.id) {
    throw new Error(socialMessages.googleNotReady);
  }

  window.__camstoreGoogleCredentialCallback = onCredential;

  if (window.__camstoreGoogleClientId !== clientId) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback(response) {
        if (response?.credential) {
          window.__camstoreGoogleCredentialCallback?.(response.credential);
        }
      },
      use_fedcm_for_prompt: true,
    });
    window.__camstoreGoogleClientId = clientId;
  }

  if (buttonElement) {
    const buttonWidth = Math.round(
      buttonElement.getBoundingClientRect().width || buttonElement.parentElement?.getBoundingClientRect().width || 260
    );

    buttonElement.innerHTML = '';
    window.google.accounts.id.renderButton(buttonElement, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      shape: 'rectangular',
      text,
      locale: 'vi',
      width: Math.max(220, Math.min(buttonWidth - 20, 400)),
    });
  }
};

export const requestGoogleCredential = async () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error(socialMessages.googleNotConfigured);
  }

  await loadScript('google-identity-services', 'https://accounts.google.com/gsi/client');

  if (!window.google?.accounts?.id) {
    throw new Error(socialMessages.googleNotReady);
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const failTimer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Không thể mở đăng nhập Google. Vui lòng thử lại.'));
      }
    }, 45000);

    window.__camstoreGoogleCredentialCallback = (credential) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(failTimer);
      resolve(credential);
    };

    if (window.__camstoreGoogleClientId !== clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback(response) {
          if (response?.credential) {
            window.__camstoreGoogleCredentialCallback?.(response.credential);
          }
        },
        use_fedcm_for_prompt: true,
      });
      window.__camstoreGoogleClientId = clientId;
    }

    window.google.accounts.id.prompt((notification) => {
      if (settled) {
        return;
      }

      const blocked =
        notification.isNotDisplayed?.() ||
        notification.isSkippedMoment?.();

      if (blocked) {
        settled = true;
        window.clearTimeout(failTimer);
        reject(new Error('Google chưa thể hiển thị hộp thoại đăng nhập. Hãy kiểm tra OAuth origin hoặc thử lại.'));
      }
    });
  });
};

export const requestFacebookAccessToken = async () => {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;

  if (!appId) {
    throw new Error(socialMessages.facebookNotConfigured);
  }

  await loadScript('facebook-jssdk', 'https://connect.facebook.net/vi_VN/sdk.js');

  if (!window.FB) {
    throw new Error(socialMessages.facebookNotReady);
  }

  if (window.__camstoreFacebookAppId !== appId) {
    window.FB.init({
      appId,
      cookie: false,
      xfbml: false,
      version: import.meta.env.VITE_FACEBOOK_API_VERSION || 'v25.0',
    });
    window.__camstoreFacebookAppId = appId;
  }

  return new Promise((resolve, reject) => {
    window.FB.login(
      (response) => {
        const accessToken = response?.authResponse?.accessToken;

        if (!accessToken) {
          reject(new Error(socialMessages.facebookCancelled));
          return;
        }

        resolve(accessToken);
      },
      {
        scope: 'public_profile',
        return_scopes: true,
      }
    );
  });
};
