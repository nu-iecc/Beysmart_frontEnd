export const LOGIN_STRINGS = {
    welcome: {
      brandTitle: "Bey-Smart",
      tagline: "Your home, Bey-Smart.",
      actions: {
        login: "Login",
        createAccount: "Create Account",
      },
    },
  
    methodSelect: {
      title: "How would you like to log in?",
      subtitle: "Choose your preferred login method",
      actions: {
        loginWithEmail: "Continue with Email",
        loginWithPhone: "Continue with Phone",
      },
      accessibility: {
        back: "Back",
        securityNote: "Your data is securely encrypted",
      },
    },
  
    emailLogin: {
      title: "Welcome Back",
      subtitle: "Log in to your account",
      fields: {
        emailLabel: "Email Address",
        emailPlaceholder: "Your email address",
        passwordLabel: "Password",
        passwordPlaceholder: "Password",
      },
      actions: {
        login: "Log In",
        forgotPassword: "Forgot password?",
      },
    },
  
    phoneLogin: {
      title: "Enter your phone",
      subtitle: "We'll send you a verification code",
      fields: {
        countryLabel: "Country/Region",
        phoneLabel: "Phone number",
        dialCodePlaceholder: "+20",
        phonePlaceholder: "(123) 456-7890",
      },
      defaults: {
        country: "Egypt",
        dialCode: "+20",
      },
      actions: {
        sendCode: "Send verification code",
      },
      accessibility: {
        securityNote: "Your data is securely encrypted",
      },
    },
  
    verifyCode: {
      title: "Enter the code",
      subtitle: "We've sent a code to {phone}",
      actions: {
        continue: "Continue",
        resend: "Resend Code",
        resendCountdown: "Resend code in {seconds}s",
      },
      accessibility: {
        securityNote: "Your data is securely encrypted",
      },
    },
  
  } as const;
  
  