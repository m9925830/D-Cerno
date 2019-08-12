initApp = function() {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        var displayName = user.displayName;
        var email = user.email;
        var emailVerified = user.emailVerified;
        var photoURL = user.photoURL;
        var uid = user.uid;
        var phoneNumber = user.phoneNumber;
        var providerData = user.providerData;
        user.getIdToken().then(function(accessToken) {
          document.getElementById('sign-in-status').textContent = 'Signed in';
          document.getElementById('sign-in').textContent = 'Sign out';
          document.getElementById('account-details').textContent = JSON.stringify({
            displayName: displayName,
            email: email,
            emailVerified: emailVerified,
            phoneNumber: phoneNumber,
            photoURL: photoURL,
            uid: uid,
            accessToken: accessToken,
            providerData: providerData
          }, null, '  ');
        });
      } else {
        // User is signed out.
        document.getElementById('sign-in-status').textContent = 'Signed out';
        document.getElementById('sign-in').textContent = 'Sign in';
        document.getElementById('account-details').textContent = 'null';
      }
    }, function(error) {
      console.log(error);
    });
  };

  window.addEventListener('load', function() {
    initApp();
  });

  ui.start('#firebaseui-auth-container', {
    signInOptions: [
      {
        provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
        // Use email link authentication and do not require password.
        // Note this setting affects new users only.
        // For pre-existing users, they will still be prompted to provide their
        // passwords on sign-in.
        signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
        // Allow the user the ability to complete sign-in cross device, including
        // the mobile apps specified in the ActionCodeSettings object below.
        forceSameDevice: false,
        // Used to define the optional firebase.auth.ActionCodeSettings if
        // additional state needs to be passed along request and whether to open
        // the link in a mobile app if it is installed.
        emailLinkSignIn: function() {
          return {
            // Additional state showPromo=1234 can be retrieved from URL on
            // sign-in completion in signInSuccess callback by checking
            // window.location.href.
            url: 'https://www.example.com/completeSignIn?showPromo=1234',
            // Custom FDL domain.
            dynamicLinkDomain: 'example.page.link',
            // Always true for email link sign-in.
            handleCodeInApp: true,
            // Whether to handle link in iOS app if installed.
            iOS: {
              bundleId: 'com.example.ios'
            },
            // Whether to handle link in Android app if opened in an Android
            // device.
            android: {
              packageName: 'com.example.android',
              installApp: true,
              minimumVersion: '12'
            }
          };
        }
      }
    ]
  });