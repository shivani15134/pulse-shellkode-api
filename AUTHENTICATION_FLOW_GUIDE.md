# Google Authentication Flow - Complete Guide

## What is Authentication?

Authentication is the process of verifying who someone is. Think of it like showing your ID at a bank - you prove you are who you say you are. In our app, when someone clicks "Sign up with Google", we're letting Google verify their identity instead of us storing passwords.

---

## The Big Picture

When a user clicks "Sign up with Google" on your frontend:
1. We send them to Google to log in
2. Google verifies their identity
3. Google sends back their information (email, name, profile picture)
4. We save their information in our database
5. We give them a security token (like a temporary ID card) so they can use our app

---

## Files Involved in Authentication

### 1. **app.module.ts** - The Main Configuration Hub
**Location**: `src/app.module.ts`

**What it does**: Sets up all the main features of the backend server.

**Why it matters**: This is where we tell NestJS to use the Authentication system. It's like the main control room that connects all systems together.

**Key responsibilities**:
- Imports the AuthModule (which handles all authentication logic)
- Imports the UsersModule (which manages user data)
- Sets up the database connection using environment variables
- Configures global settings

---

### 2. **auth.module.ts** - Authentication Configuration
**Location**: `src/auth/auth.module.ts`

**What it does**: Sets up all the authentication tools we need.

**Why it matters**: This module brings together all the authentication pieces like a toolbox with all the right tools.

**Key responsibilities**:
- Imports PassportModule (a library that handles Google OAuth)
- Imports JwtModule (a library that creates security tokens)
- Connects to UsersModule so we can save user information
- Registers GoogleStrategy (tells the system how Google authentication works)
- Makes AuthService available (the logic for authentication)

---

### 3. **google.strategy.ts** - The Google Connection
**Location**: `src/auth/google.strategy.ts`

**What it does**: This file tells our backend HOW to connect to Google and HOW to talk to Google.

**Why it matters**: Google doesn't speak our language - we need a translator. This file is the translator between our app and Google.

**Key responsibilities**:
- Stores Google credentials (Google Client ID and Client Secret - like API keys)
- Tells Google where to send the user back after they log in (callback URL)
- Defines what information we ask from Google (email and profile)
- Has a `validate()` function that processes Google's response and extracts the user's data

**The Flow Here**:
- User logs into Google
- Google sends back: email, name, profile picture, and unique Google ID
- The `validate()` function formats this data into a standard format
- This formatted data is passed to the next step

---

### 4. **auth.controller.ts** - The Request Handler
**Location**: `src/auth/auth.controller.ts`

**What it does**: This file handles all requests related to authentication. Think of it as the receptionist that directs requests to the right department.

**Why it matters**: This is where the action starts. When someone clicks "Sign up with Google", this file receives that request.

#### **Step 1: /auth/google Endpoint**

**What happens when this endpoint is called**:
1. We receive a request from the frontend
2. We create a "state" token (a random code for security purposes - prevents hackers from tricking our system)
3. We store this state token in a cookie (a small file stored in the user's browser)
4. We build a special URL pointing to Google's login page with our credentials
5. We redirect the user's browser to Google
6. User sees Google's login screen and logs in

**Why all these steps**:
- The state token is like a secret handshake - we give the user a code, and when they come back, they must give us the same code back
- If the code doesn't match, we know something fishy happened (like a hacker trying to trick us)

#### **Step 2: /auth/google/callback Endpoint**

**What happens when this endpoint is called** (Google redirects here after user logs in):

**Security Check** (Step 1 of callback):
1. Google sends back the state token we gave the user
2. We check if this state token matches the one we stored
3. If they don't match, we reject the request (security breach)
4. If they match, we clear the state token from the cookie (we don't need it anymore)

**Getting User Data** (Step 2 of callback):
1. Google sends back the authorization code
2. The GoogleStrategy (passport-google-oauth20) automatically exchanges this code for actual user data
3. User data includes: email, name, profile picture, unique Google ID

**User Database Check** (Step 3 of callback):
1. We pass the user data to the AuthService

---

### 5. **auth.service.ts** - The Business Logic
**Location**: `src/auth/auth.service.ts`

**What it does**: This file contains the main logic for authentication actions.

**Why it matters**: This is the brain of the authentication system - it makes the important decisions.

**Key responsibilities**:
- `validateOrCreateUser()`: Calls the users service to find or create a user in the database
- `generateAccessToken()`: Creates a short-lived security token (expires in 10 minutes)
- `generateRefreshToken()`: Creates a long-lived security token (expires in 7 days)
- `verifyRefreshToken()`: Checks if a refresh token is valid

**Token Explanation**:
- **Access Token**: A temporary pass that lets the user use the app. It expires quickly (10 minutes) for security.
- **Refresh Token**: A longer-lived pass that lets the user get a new Access Token without logging in again. Expires after 7 days.
- Think of it like a day pass (Access Token) and a membership card (Refresh Token) to a gym.

---

### 6. **users.service.ts** - User Data Management
**Location**: `src/users/users.service.ts`

**What it does**: This file manages user information in the database.

**Why it matters**: This is where we actually store and retrieve user data.

**Key responsibilities**:
- `findOrCreateGoogleUser()`: This is the most important function for Google sign-up

**How findOrCreateGoogleUser() works** (Step by step):
1. **Check if user exists**: Search the database for a user with the same email
2. **If user exists**: Return the existing user (they're just logging in again)
3. **If user doesn't exist**: Create a new user with:
   - Email (from Google)
   - Name (from Google)
   - Google ID (from Google)
4. **Save to database**: Insert the new user into the database
5. **Return user**: Send back the user object

---

### 7. **user.entity.ts** - User Data Structure
**Location**: `src/users/user.entity.ts`

**What it does**: Defines what information we store about a user.

**Why it matters**: This is the blueprint for user data - it tells the database what columns to create and what types of data go in each column.

---

## Complete Step-by-Step Flow

### When User Clicks "Sign up with Google"

**STEP 1: User clicks button on frontend**
- Frontend shows a "Sign up with Google" button
- User clicks it

**STEP 2: Request hits /auth/google endpoint**
- The auth.controller.ts receives the request
- Creates a random state token for security
- Stores it in a cookie on the user's browser
- Builds a URL to Google's authentication page with:
  - Our Google Client ID (identifies our app to Google)
  - Our app's callback URL (where to send user back)
  - Requested permissions (email, profile picture)
  - The state token

**STEP 3: User redirected to Google**
- User's browser navigates to Google login page
- User logs in with their Google account
- User grants permission for our app to access their email and profile

**STEP 4: Google redirects to /auth/google/callback**
- Google sends the user back to our server with:
  - An authorization code (proof that user logged into Google)
  - The state token we sent earlier

**STEP 5: auth.controller.ts validates state**
- Checks if the state token matches what we stored
- If not matching → reject (potential security issue)
- If matching → continue and delete the state token

**STEP 6: GoogleStrategy exchanges code for user data**
- Automatically exchanges the authorization code with Google
- Gets back user info: email, name, profile picture, Google ID

**STEP 7: AuthService validates or creates user**
- Calls auth.service.ts to process the user data
- auth.service.ts calls users.service.ts

**STEP 8: UsersService checks database**
- Searches database for user with that email
- **If found**: Return the existing user
- **If not found**: Create new user with:
  - Their email from Google
  - Their name from Google
  - Their unique Google ID from Google
  - Save to database

**STEP 9: Generate security tokens**
- AuthService creates two tokens:
  - Access Token (short-lived, 10 minutes)
  - Refresh Token (long-lived, 7 days)

**STEP 10: Send tokens to frontend**
- Tokens are sent as cookies to the user's browser
- User is redirected back to the app with tokens

**STEP 11: User can now use the app**
- Access Token proves user identity for each request
- When Access Token expires, Refresh Token lets user get a new one without logging in again

---

## Summary Table

| File | Purpose | Main Job |
|------|---------|----------|
| app.module.ts | Main config | Connects everything together |
| auth.module.ts | Auth setup | Loads authentication tools |
| google.strategy.ts | Google translator | Talks to Google, extracts user data |
| auth.controller.ts | Request handler | Handles /auth/google and /auth/google/callback routes |
| auth.service.ts | Authentication logic | Creates tokens, manages authentication flow |
| users.service.ts | User database | Saves/retrieves users from database |
| user.entity.ts | User blueprint | Defines user data structure |

---

## Environment Variables Needed

These must be set in a `.env` file:
- `GOOGLE_CLIENT_ID`: Your Google app's ID
- `GOOGLE_CLIENT_SECRET`: Your Google app's secret
- `JWT_SECRET`: Secret key for creating tokens
- `DB_HOST`: Database server address
- `DB_PORT`: Database server port
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

---

## Why Each File is Important

1. **auth.controller.ts**: Without it, the backend wouldn't know how to handle login requests
2. **google.strategy.ts**: Without it, the backend wouldn't know how to talk to Google
3. **auth.service.ts**: Without it, we wouldn't create security tokens for users
4. **users.service.ts**: Without it, we couldn't save user data
5. **auth.module.ts**: Without it, none of these services would be connected
6. **app.module.ts**: Without it, the auth module wouldn't be loaded into the app

---

## Security Concepts Explained

**State Token**: Prevents a hacker from redirecting a user to Google, intercepting their login, and then using that to access our app pretending to be them.

**Access Token**: Expires quickly so if it's stolen, it can only be used for 10 minutes.

**Refresh Token**: Allows user to get a new Access Token without logging in again, stored separately for extra security.

**HTTPS Only**: All this should happen over secure connections to prevent data interception.

