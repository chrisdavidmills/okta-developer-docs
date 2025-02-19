### 1: Register new users

The self-registration flow begins when the user clicks the **Sign up** link on your app's sign-in page. Create a **Sign up** link that directs the user to a create account form, similar to the following wireframe.

<div class="half wireframe-border">

![A sign-in form with fields for username and password, a next button, and links to the sign-up and forgot your password forms](/img/wireframes/sign-in-form-username-password-sign-up-forgot-your-password-links.png)

<!--

Source image: https://www.figma.com/file/YH5Zhzp66kGCglrXQUag2E/%F0%9F%93%8A-Updated-Diagrams-for-Dev-Docs?node-id=3398%3A36729&t=wzNwSZkdctajVush-1 sign-in-form-username-password-sign-up-forgot-your-password-links
 -->

</div>

You need to create a form to capture the user's new account details.

<div class="half wireframe-border">

![A sign-up form with fields for first name, last name, and email address, and a create account button](/img/wireframes/sign-up-form-first-last-name-email.png)

<!--

Source image: https://www.figma.com/file/YH5Zhzp66kGCglrXQUag2E/%F0%9F%93%8A-Updated-Diagrams-for-Dev-Docs?node-id=3399%3A36911&t=2h5Mmz3COBLhqVzv-1  sign-up-form-first-last-name-email
 -->

</div>

Begin the authentication process by calling the Java SDK's `IDXAuthenticationWrapper.begin()` method.

```java
AuthenticationResponse beginResponse = idxAuthenticationWrapper.begin();
```

After the authentication transaction begins, you need to call `getProceedContext()` to get the [`ProceedContext`](https://github.com/okta/okta-idx-java/blob/master/api/src/main/java/com/okta/idx/sdk/api/client/ProceedContext.java) object containing the current state of the authentication flow, and pass it as a parameter in an `IDXAuthenticationWrapper.fetchSignUpFormValues()` call to dynamically build the create account form:

```java
ProceedContext beginProceedContext = beginResponse.getProceedContext();
AuthenticationResponse newUserRegistrationResponse = idxAuthenticationWrapper.fetchSignUpFormValues(beginProceedContext);
```

> **Note:** `IDXAuthenticationWrapper.fetchSignUpFormValues()` allows you to build the create account form dynamically from the required form values.

### 2: The user enters their profile data

Enroll the user with basic profile information captured from the create account form by calling the `IDXAuthenticationWrapper.register()` method.

```java
UserProfile userProfile = new UserProfile();
userProfile.addAttribute("lastName", lastname);
userProfile.addAttribute("firstName", firstname);
userProfile.addAttribute("email", email);

ProceedContext proceedContext = newUserRegistrationResponse.getProceedContext();

AuthenticationResponse authenticationResponse = idxAuthenticationWrapper.register(proceedContext, userProfile);
```

### 3: Display the enrollment authenticators

After you've configured your org and app with instructions from [Set up your Okta org for a multifactor use case](/docs/guides/oie-embedded-common-org-setup/java/main/#set-up-your-okta-org-for-a-multifactor-use-case), your app is configured with Password authentication, and additional Email or Phone factors. Authenticators are the factor credentials, owned or controlled by the user, that can be verified during authentication.

This step contains the request to enroll a password authenticator for the user.

After the initial register request, `IDXAuthenticationWrapper.register()` returns an [`AuthenticationResponse`](https://github.com/okta/okta-idx-java/blob/master/api/src/main/java/com/okta/idx/sdk/api/response/AuthenticationResponse.java) object containing the following properties:

* `AuthenticationStatus=AWAITING_AUTHENTICATOR_ENROLLMENT_SELECTION` &mdash; This status indicates that there are required authenticators that need to be verified.

* `Authenticators` &mdash; List of [authenticators](https://github.com/okta/okta-idx-java/blob/master/api/src/main/java/com/okta/idx/sdk/api/client/Authenticator.java) (in this case, there is only the password authenticator).

After receiving the `AWAITING_AUTHENTICATOR_ENROLLMENT_SELECTION` status and the list of authenticators, you need to provide the user with a form to select the authenticator to enroll. In the following example, there is only one password authenticator to enroll:

<div class="half wireframe-border">

![A choose your authenticator form with only a password authenticator option and a next button](/img/wireframes/choose-authenticator-form-password-only.png)

<!--

Source image: https://www.figma.com/file/YH5Zhzp66kGCglrXQUag2E/%F0%9F%93%8A-Updated-Diagrams-for-Dev-Docs?node-id=3399%3A36946&t=2h5Mmz3COBLhqVzv-1 choose-authenticator-form-password-only
 -->

</div>

> **Tip:** Build a generic authenticator selection form to handle single or multiple authenticators returned from the SDK.

For example, the previous form could be generated by using the following code snippet:

```java
public ModelAndView selectAuthenticatorForm(AuthenticationResponse response, String title, HttpSession session) {
   boolean canSkip = authenticationWrapper.isSkipAuthenticatorPresent(response.getProceedContext());
   ModelAndView modelAndView = new ModelAndView("select-authenticator");
   modelAndView.addObject("canSkip", canSkip);
   List<String> factorMethods = new ArrayList<>();
   for (Authenticator authenticator : response.getAuthenticators()) {
      for (Authenticator.Factor factor : authenticator.getFactors()) {
            factorMethods.add(factor.getMethod());
      }
   }
   session.setAttribute("authenticators", response.getAuthenticators());
   modelAndView.addObject("factorList", factorMethods);
   modelAndView.addObject("authenticators", response.getAuthenticators());
   modelAndView.addObject("title", title);
   return modelAndView;
}
```

### 4: The user selects the authenticator to enroll

Pass the user-selected authenticator (in this case, the password authenticator) to the `IDXAuthenticationWrapper.selectAuthenticator()` method.

```java
authenticationResponse = idxAuthenticationWrapper.selectAuthenticator(proceedContext, authenticator);
```

This request returns an `AuthenticationResponse` object with property `AuthenticationStatus=AWAITING_AUTHENTICATOR_VERIFICATION`. You need to build a form for the user to enter their password in this authenticator verification step.

<div class="half wireframe-border">

![A set password form with two fields to enter and to confirm a password and a submit button](/img/wireframes/set-password-form-new-password-fields.png)

<!--

Source image: https://www.figma.com/file/YH5Zhzp66kGCglrXQUag2E/%F0%9F%93%8A-Updated-Diagrams-for-Dev-Docs?node-id=3399%3A36973&t=2h5Mmz3COBLhqVzv-1 set-password-form-new-password-fields
 -->

</div>

### 5: Verify the authenticator and display additional authenticators

After the user enters their new password, call the `IDXAuthenticationWrapper.verifyAuthenticator()` method with the user's password.

```java
VerifyAuthenticatorOptions verifyAuthenticatorOptions = new VerifyAuthenticatorOptions(newPassword);
AuthenticationResponse authenticationResponse = idxAuthenticationWrapper.verifyAuthenticator(proceedContext, verifyAuthenticatorOptions);
```

The request returns an `AuthenticationResponse` object with the `AuthenticationStatus=AWAITING_AUTHENTICATOR_ENROLLMENT_SELECTION` property and an `Authenticators` list containing the email and phone factors. Reuse the authenticator enrollment form from step [3: Display the enrollment authenticators](#_3-display-the-enrollment-authenticators) to display the list of authenticators to the user.

<div class="half wireframe-border">

![A choose your authenticator form with email and phone authenticator options and a next button](/img/wireframes/choose-authenticator-form-email-phone.png)

<!--

Source image: https://www.figma.com/file/YH5Zhzp66kGCglrXQUag2E/%F0%9F%93%8A-Updated-Diagrams-for-Dev-Docs?node-id=3399%3A37020&t=2h5Mmz3COBLhqVzv-1 choose-authenticator-form-email-phone
 -->

</div>

### 6: The user selects the email authenticator

In this use case, the user selects the **Email** factor as the authenticator to verify. Pass this user-selected authenticator to the `IDXAuthenticationWrapper.selectAuthenticator()` method.

```java
authenticationResponse = idxAuthenticationWrapper.selectAuthenticator(proceedContext, authenticator);
```

If this request is successful, a code is sent to the user's email and `AuthenticationStatus=AWAITING_AUTHENTICATOR_VERIFICATION` is returned. You need to build a form to capture the code for this verification step.

<div class="half wireframe-border">

![A form with a field for a verification code and a submit button](/img/wireframes/enter-verification-code-form.png)

<!--

Source image: https://www.figma.com/file/YH5Zhzp66kGCglrXQUag2E/%F0%9F%93%8A-Updated-Diagrams-for-Dev-Docs?node-id=3398%3A36808&t=2h5Mmz3COBLhqVzv-1 enter-verification-code-form
 -->

</div>

> **Note:** The email sent to the user has a **Verify Email Address** link that isn't yet supported. There are two recommended options to mitigate this limitation. See [The email link to verify that the email address isn't working](/docs/guides/oie-embedded-sdk-limitations/main/#the-email-link-to-verify-that-the-email-address-isn-t-working) for details.

### 7: The user submits the email verification code

The user receives the verification code in their email and submits it in the verify code form. Use [`VerifyAuthenticationOptions`](https://github.com/okta/okta-idx-java/blob/master/api/src/main/java/com/okta/idx/sdk/api/model/VerifyAuthenticatorOptions.java) to capture the code and send it to the `IDXAuthenticationWrapper.verifyAuthenticator()` method:

```java
VerifyAuthenticatorOptions verifyAuthenticatorOptions = new VerifyAuthenticatorOptions(code);
AuthenticationResponse authenticationResponse =
   idxAuthenticationWrapper.verifyAuthenticator(proceedContext, verifyAuthenticatorOptions);
```

If the request to verify the code is successful, the SDK returns an `AuthenticationResponse` object with the `AuthenticationStatus=AWAITING_AUTHENTICATOR_ENROLLMENT_SELECTION` property and an `Authenticators` list containing the phone factor. Reuse the authenticator enrollment form from step [3: Display the enrollment authenticators](#_3-display-the-enrollment-authenticators) to display the list of authenticators to the user.

```java
public ModelAndView selectAuthenticatorForm(AuthenticationResponse response, String title, HttpSession session) {
   boolean canSkip = authenticationWrapper.isSkipAuthenticatorPresent(response.getProceedContext());
   ModelAndView modelAndView = new ModelAndView("select-authenticator");
   modelAndView.addObject("canSkip", canSkip);
   List<String> factorMethods = new ArrayList<>();
   for (Authenticator authenticator : response.getAuthenticators()) {
      for (Authenticator.Factor factor : authenticator.getFactors()) {
            factorMethods.add(factor.getMethod());
      }
   }
   session.setAttribute("authenticators", response.getAuthenticators());
   modelAndView.addObject("factorList", factorMethods);
   modelAndView.addObject("authenticators", response.getAuthenticators());
   modelAndView.addObject("title", title);
   return modelAndView;
}
```

Based on the configuration described in [Set up your Okta org for a multifactor use case](/docs/guides/oie-embedded-common-org-setup/java/main/#set-up-your-okta-org-for-a-multifactor-use-case), the app in this use case is set up to require one possession factor (either email or phone). In addition, your [org is configured with both email and phone enrollment factors set to optional](#_3-set-the-email-and-phone-authenticators-as-optional-enrollment-factors). Therefore, after the email factor is verified, the phone factor becomes optional. In this step, the `isSkipAuthenticatorPresent()` function returns `TRUE` for the phone authenticator. You can build a **Skip** button in your form to allow the user to skip the optional phone factor.

If the user decides to skip the optional factor, they are considered signed in since they've already verified the required factors. See step [8, Option 1: The user skips the phone authenticator](#option-1-the-user-skips-the-phone-authenticator) for the skip authenticator flow. If the user decides to select the optional factor, see step [8, Option 2: The user selects the phone authenticator](#option-2-the-user-selects-the-phone-authenticator) for the optional phone authenticator flow.

<div class="half wireframe-border">

![A choose your authenticator form with only a phone authenticator option, and next and skip buttons](/img/wireframes/choose-authenticator-form-phone-only-with-skip.png)

<!--

Source image: https://www.figma.com/file/YH5Zhzp66kGCglrXQUag2E/%F0%9F%93%8A-Updated-Diagrams-for-Dev-Docs?node-id=3399%3A37043&t=2h5Mmz3COBLhqVzv-1 choose-authenticator-form-phone-only-with-skip
 -->

</div>

### 8: Handle the phone authenticator options

#### Option 1: The user skips the phone authenticator

If the user decides to skip the phone factor enrollment, make a call to the  `IDXAuthenticationWrapper.skipAuthenticatorEnrollment()` method. This method skips the authenticator enrollment.

```java
if ("skip".equals(action)) {
   logger.info("Skipping {} authenticator", authenticatorType);
   authenticationResponse = idxAuthenticationWrapper.skipAuthenticatorEnrollment(proceedContext);
   return responseHandler.handleKnownTransitions(authenticationResponse, session);
}
```

> **Note:** Ensure that `isSkipAuthenticatorPresent()=TRUE` for the authenticator before calling `skipAuthenticatorEnrollment()`.

If the request to skip the optional authenticator is successful, the SDK returns an `AuthenticationResponse` object with `AuthenticationStatus=SUCCESS` and the user is successfully signed in. Use the `AuthenticationResponse.getTokenResponse()` method to retrieve the required tokens (access, refresh, ID) for authenticated user activity.

#### Option 2: The user selects the phone authenticator

In this use case option, the user selects the optional phone factor as the authenticator to verify. Pass this selected authenticator to the `IDXAuthenticationWrapper.selectAuthenticator()` method.

```java
authenticationResponse = idxAuthenticationWrapper.selectAuthenticator(proceedContext, authenticator);
```

The response from this request is an `AuthenticationResponse` object with `AuthenticationStatus=AWAITING_AUTHENTICATOR_ENROLLMENT_DATA`.

This status indicates that the user needs to provide additional authenticator information. In the case of the phone authenticator, the user needs to specify a phone number, and whether they want to use SMS or voice as the verification method.

##### The user enters their phone number and the SMS verify method

You need to build a form to capture the user's phone number as well as a subsequent form for the user to select their phone verification method (either SMS or voice).

<div class="half wireframe-border">

![A form with a field for a phone number, formatting advice and a next button](/img/wireframes/enter-phone-number-form.png)

<!--

Source image: https://www.figma.com/file/YH5Zhzp66kGCglrXQUag2E/%F0%9F%93%8A-Updated-Diagrams-for-Dev-Docs?node-id=3399%3A37078&t=2h5Mmz3COBLhqVzv-1 enter-phone-number-form
 -->

</div>

> **Note:** The Java SDK requires the following phone number format: `{+}{country-code}{area-code}{number}`. For example, `+15556667777`.

<div class="half wireframe-border">

![A choose your phone verification method form with SMS and Voice options and a next button](/img/wireframes/choose-phone-verification-method-form.png)

<!--

Source image: https://www.figma.com/file/YH5Zhzp66kGCglrXQUag2E/%F0%9F%93%8A-Updated-Diagrams-for-Dev-Docs?node-id=3400%3A37129&t=vr9MuCR8C4rCt3hC-1 choose-phone-verification-method-form
 -->

</div>

When the user enters their phone number and selects SMS to receive the verification code, capture this information and send it to the `IDXAuthenticationWrapper.submitPhoneAuthenticator()` method.

For example:

```java
ProceedContext proceedContext = Util.getProceedContextFromSession(session);

AuthenticationResponse authenticationResponse =
   idxAuthenticationWrapper.submitPhoneAuthenticator(proceedContext,
         phone, getFactorFromMethod(session, mode));
```

> **Note:** The option to select the voice or SMS verification method is supported only if your org is enabled with the voice feature. This use case assumes that your org is enabled with the voice feature. See [Sign in with password and phone factors](/docs/guides/oie-embedded-sdk-use-case-sign-in-pwd-phone/java/main) for the alternate phone authenticator flow where the voice feature isn't enabled in an org.

The Java SDK sends the phone authenticator data to Okta. Okta processes the request and sends an SMS code to the specified phone number. After the SMS code is sent, Okta sends a response to the SDK, which returns `AuthenticationStatus=AWAITING_AUTHENTICATOR_VERIFICATION` to your app. This status indicates that the user needs to provide the verification code for the phone authenticator.

You need to build a form to capture the user's SMS verification code.

##### The user submits the SMS verification code

The user receives the verification code as an SMS on their phone and submits it in the verify code form. Send this code to the `IDXAuthenticationWrapper.verifyAuthenticator()` method:

```java
VerifyAuthenticatorOptions verifyAuthenticatorOptions = new VerifyAuthenticatorOptions(code);
AuthenticationResponse authenticationResponse =
   idxAuthenticationWrapper.verifyAuthenticator(proceedContext, verifyAuthenticatorOptions);
```

If the request to verify the code is successful, the SDK returns an `AuthenticationResponse` object with `AuthenticationStatus=SUCCESS` and the user is successfully signed in. Use the `AuthenticationResponse.getTokenResponse()` method to retrieve the required tokens (access, refresh, ID) for authenticated user activity.
