# PR #2: fix: update header immediately on logout (BStackDemoWebModified)

Change: src/components/Header/index.jsx. The header now keeps the username in React state (seeded from sessionStorage) and clears it on logout.

Problem fixed: clicking Logout on the home page ("/") cleared the session, but the header still showed "Logout" and the username, because Router.replace('/') is a no-op on "/".

Requirements / acceptance criteria:
- Sign in as demouser, click Logout on "/": header shows "Sign In", username is gone, sessionStorage is empty.
- Clicking "Sign In" afterwards navigates to /signin.
- Logout from /orders redirects to "/" with the signed-out header.
- First paint is unchanged for a signed-in user (header shows username and "Logout" on load).
- Logout while the cart has items: the header still updates.
- Logout then sign in again as a different user shows the new username.
- After logout, protected pages (favourites, orders) require sign-in.
- No console or page errors.

App: Next.js demo store at http://localhost:3000. Header elements: #signin (link text Sign In / Logout), .username, #favourites, #orders. Users: demouser, fav_user (select from react-select on /signin).
