# 06 — Handoff Document

**For:** the LDA of PA staff member(s) who will own the LDAPA Intelligent Portal going forward.
**Technical level assumed:** none. You are comfortable using websites and email, and you do not need to read any code.

If a section sends you to a specific page in Railway, Vercel, or OpenAI, it will tell you exactly what to click. When something has to be done in code or the terminal, it will say "ask a developer to do X" rather than expect you to do it yourself.

---

## Table of Contents

1. [What was built — in plain language](#1-what-was-built--in-plain-language)
2. [Your single login for everything](#2-your-single-login-for-everything)
3. [The three places the system lives](#3-the-three-places-the-system-lives)
4. [URGENT — things to do in your first week](#4-urgent--things-to-do-in-your-first-week)
5. [Adding payment info to Railway (before the free trial expires)](#5-adding-payment-info-to-railway-before-the-free-trial-expires)
6. [Setting up OpenAI credits and your API key](#6-setting-up-openai-credits-and-your-api-key)
7. [Logging into the Admin Panel + changing the default password](#7-logging-into-the-admin-panel--changing-the-default-password)
8. [Day-to-day admin tasks](#8-day-to-day-admin-tasks)
9. [What can break and how to tell](#9-what-can-break-and-how-to-tell)
10. [Post-Deployment Support](#10-post-deployment-support)
11. [Glossary](#11-glossary)

---

## 1. What was built — in plain language

We built a website that lets people who need help with learning disabilities chat with a friendly AI and get pointed to the right kind of support in Pennsylvania. Instead of hunting through a long list of names, a parent can just type "my 9-year-old is struggling with reading in Pittsburgh" and the site suggests tutors, therapists, or other providers who match.

There are **two websites** and **one behind-the-scenes service**:

- **The public portal** — what parents and adults visit. It's the chat. https://ldapa-public-portal.vercel.app
- **The admin panel** — what LDA of PA staff use to manage the provider list, see what people are asking about, and mark providers as "verified." https://ldapa-admin-panel.vercel.app
- **The backend** — an invisible service running on a cloud host called Railway. It stores all the data and talks to OpenAI (the company behind ChatGPT) to generate the AI responses. You don't visit this directly, but you log into it to check it's running and to manage settings.

Behind the scenes:

- The provider list (3,610 tutors, therapists, lawyers, schools, advocates) was imported from the **Brilliant Directories** CSV export the LDA of PA already had.
- Every conversation is saved so you can read back what people are asking about.
- Users can click thumbs-up or thumbs-down on any AI answer — you see the ratings in the admin dashboard.

**For more technical detail**, see Docs 1–5 in this handoff folder. Those are written for developers; you will not normally need them.

---

## 2. Your single login for everything

Almost every service the portal depends on is signed in with the same Google account:

> **directory@ldaofpa.org**

When a page shows a **"Sign in with Google"** or **"Continue with Google"** button, click it and choose this account. Same email. Same password. Same account.

This covers:

| Service | URL | What you do there |
|---------|-----|-------------------|
| GitHub | https://github.com/ldaofpa-directory/ldapa-portal | The source code. You'll rarely open this. |
| Railway | https://railway.com/project/dd7377a4-0528-4aa5-bc96-cf5f08f015b9 | The backend and database. Billing lives here. |
| Vercel | https://vercel.com/ (log in and you'll see two projects: `ldapa-public-portal` and `ldapa-admin-panel`) | The two websites. Free forever at current traffic. |
| OpenAI Platform | https://platform.openai.com/ | The AI. Billing and API keys live here. |

The **admin panel of the portal itself** is the exception — it uses its own email+password login, not Google. That's covered in §7.

---

## 3. The three places the system lives

| # | Platform | What it does | Where to click |
|---|---------|-------------|----------------|
| 1 | **Railway** | Runs the backend + the database | https://railway.com/project/dd7377a4-0528-4aa5-bc96-cf5f08f015b9 |
| 2 | **Vercel** | Hosts the two websites | https://vercel.com/ |
| 3 | **OpenAI** | Powers the AI replies | https://platform.openai.com/ |

All three are accessed with `directory@ldaofpa.org`. If you want a mental picture: Vercel shows the user what they see, Railway holds the data and logic, OpenAI writes the answers.

---

## 4. URGENT — things to do in your first week

These are not optional. Do them as soon as you take over the account.

1. **Add a payment method to Railway.** The free trial credit will run out and everything will shut off when it does. See §5.
2. **Add credits (and auto-recharge) to OpenAI.** The AI stops working the moment your balance hits zero. See §6.
3. **Save the admin password in your password manager.** The admin panel login is `directory@ldaofpa.org` with a strong random password that Hazem has given you separately. Store it somewhere durable before you close the chat. See §7.
4. **Rotate the OpenAI API key.** The key currently installed on Railway was created by the previous developer. Make your own and replace it. See §6.4.
5. **(Recommended) Turn on two-factor authentication on the `directory@ldaofpa.org` Google account.** Since that single account unlocks everything, protect it with 2FA. Do this at https://myaccount.google.com/security.

Do these five things and the system is yours.

---

## 5. Adding payment info to Railway (before the free trial expires)

Railway gives new accounts a one-time trial credit. When that runs out, your backend and database **stop running** — the websites will still load but chat won't work and the admin panel will show errors.

### How to know where you stand

1. Go to https://railway.com/
2. Log in with `directory@ldaofpa.org` (Google sign-in).
3. You'll see a project called (approximately) **"ldapa-portal"**. The top-right corner shows your plan and remaining credit.
4. Click your **profile picture (top-right)** → **Account Settings** → **Billing** to see current balance and usage.

### How to add a payment method

1. Railway → profile picture → **Account Settings** → **Billing**.
2. Click **Add Payment Method**.
3. Enter a credit card (organization card strongly recommended over a personal one).
4. Upgrade the plan. The **Hobby plan ($5/month base)** is plenty for current traffic and includes:
   - Always-on backend (no cold starts)
   - Reasonable RAM and CPU
   - The managed Postgres database
5. Confirm.

**Rough cost estimate:** $5–$15/month depending on traffic. The Hobby plan caps your bill automatically; you're never surprised by a big charge.

### What happens if you skip this

- When credit runs out: the backend service in Railway pauses.
- Symptom: the public portal's chat will show errors, and the admin panel can't log in.
- Fix: log into Railway, add a card, click **Resume**.

---

## 6. Setting up OpenAI credits and your API key

OpenAI is the service that powers the AI chat. You pay per message — typically fractions of a cent — but **your balance must stay above zero or the chat breaks**.

### 6.1 Log in

1. Go to https://platform.openai.com/
2. **Sign in with Google** → choose `directory@ldaofpa.org`.

(Note: OpenAI is a separate company from Google — "sign in with Google" just means they accept your Google identity to log you in. There is no joint account with Google.)

### 6.2 Add a payment method

1. Top-right corner → click the little ⚙ gear icon → **Billing**.
2. **Payment methods** → **Add payment method** → enter a card.

### 6.3 Top up your balance + enable Auto Recharge (strongly recommended)

This is the single most important OpenAI step.

1. Still in **Billing** → click **Add to credit balance**.
2. Add an initial amount — **$20 is a reasonable starting point** for a few months of traffic.
3. Toggle on **Automatic Recharge**. Configure it like this:
   - **When my balance falls below:** $5
   - **Auto-recharge with:** $20

With auto-recharge on, OpenAI refills your balance before it hits zero — the chat never goes dark.

**Without auto-recharge, expect the chat to stop working the day you forget to top up.**

### 6.4 Create a new API key and install it on Railway

The key currently in production was created by the previous developer. Replace it with your own so that only people who can log into `directory@ldaofpa.org` have access.

**Step A — create a new key on OpenAI:**

1. https://platform.openai.com/ → left sidebar → **API keys**.
2. Click **+ Create new secret key**.
3. Name: `ldapa-portal-production` (anything descriptive).
4. Leave "Permissions" on the default (all). Click **Create**.
5. **Copy the key immediately.** It looks like `sk-proj-abc123…`. OpenAI will not show it to you again — if you lose it, you must create another.

**Step B — install it on Railway:**

1. Go to the Railway project: https://railway.com/project/dd7377a4-0528-4aa5-bc96-cf5f08f015b9
2. Click the **backend service** (the one that is *not* labeled Postgres).
3. Go to the **Variables** tab.
4. Find the row for `OPENAI_API_KEY`.
5. Click the pencil/edit icon on that row.
6. Paste the new key. Save.
7. Railway will automatically redeploy the backend with the new key (takes ~1 minute).

**Step C — delete the old key:**

1. Back on https://platform.openai.com/ → **API keys**.
2. Find any key other than the one you just created and click **Delete**.
3. Confirm.

The new key is live. The old key can no longer be used by anyone.

### 6.5 Monitoring OpenAI spend

- https://platform.openai.com/ → **Usage** — shows your daily spend and monthly total.
- Set an **alert** under **Billing → Usage limits** — for example, email me when monthly spend exceeds $30. This is cheap insurance against a runaway bug.

---

## 7. Logging into the Admin Panel + changing the default password

The admin panel is where you actually do the work of running the directory (reviewing providers, reading chats, checking analytics).

### 7.1 Log in

1. Go to https://ldapa-admin-panel.vercel.app
2. Email: `directory@ldaofpa.org`
3. Password: the one Hazem gave you in your password manager / 1Password handover. **Do not paste it into email.**

This login is **different from your Google login**. The admin panel does not use Google — it has its own email/password account that lives inside the portal's database.

### 7.2 Rotating the password later

The password handed to you is strong and random, so there's no urgency to change it on day one. But if you ever suspect it has leaked, or you want to set one you can remember, rotate it this way:

> **The admin panel does not yet have a "change password" screen built in.** To change the password, ask a developer to:
>
> 1. Run `python -c "import bcrypt; print(bcrypt.hashpw(b'your-new-password', bcrypt.gensalt()).decode())"` to generate a hashed version of your new password.
> 2. Log into Railway → Postgres service → **Data** tab → run this SQL:
>    ```sql
>    UPDATE admin_users
>    SET password_hash = '<the hash from step 1>'
>    WHERE email = 'directory@ldaofpa.org';
>    ```
> 3. Tell you the new password verbally or through a password manager — don't email it.
>
> Doc 5, §8.1 has the same steps.
>
> **Heads-up:** the backend also ensures this admin row exists on every boot. If you rotate the password in Postgres, also update `admin_hash` in `backend/app/database.py` (the constant inside `init_db`) so a future redeploy doesn't reset your hash. Otherwise the rotation only lasts until the next Railway deploy.

Keep the admin panel URL reasonably private — it is the keys to the directory.

### 7.3 What you can do once logged in

The admin panel has these main sections:

- **Overview** — dashboard: total providers, how many are verified, chat volume chart, average feedback rating, top themes people ask about.
- **Providers** — the full directory. Search, filter, edit, verify, archive.
- **Pending Reviews** — the queue of providers that haven't been verified yet (currently 3,610 of them).
- **Import / Export** — upload a new CSV from Brilliant Directories or export the current data.
- **Analytics** — deeper usage charts.
- **Audit Log** — a history of admin actions. (UI present; not all actions are logged yet.)
- **Settings** — admin-user settings.
- **Chats** (under the legacy `/dashboard/chats` URL) — full transcripts of every conversation users have had, with feedback attached.

---

## 8. Day-to-day admin tasks

### 8.1 Verify providers

When LDA of PA confirms that a provider in the directory is still active and in good standing, mark them **Verified**:

1. Admin panel → **Providers**.
2. Search or filter to find the provider.
3. Click the provider's row → **Verify** button.
4. Or: select the checkbox next to multiple providers → **Bulk Verify**.

### 8.2 Archive providers no longer active

If a provider retires, moves out of PA, or should be hidden without deletion, **Archive** them. Archived providers do not appear in chat search results.

### 8.3 Edit a provider

1. Admin panel → **Providers** → click the row.
2. Click **Edit**.
3. Update any field (name, phone, email, pricing, methodology, insurance, specialties).
4. **Save**.

### 8.4 Add a new provider manually

Admin panel → **Providers** → **+ New** button (top right). Fill in at least a name and profession type; everything else is optional.

### 8.5 Import an updated CSV from Brilliant Directories

1. Export a fresh members CSV from the Brilliant Directories dashboard.
2. Admin panel → **Import / Export** → **Upload**.
3. Review the preview carefully — it shows which rows will be imported, which will be skipped, and why.
4. Click **Confirm Import**.

**Heads up:** the importer does not deduplicate. If you upload the same CSV twice, you'll have duplicates. If the intent is to *replace* rather than *add*, ask a developer to help clear old records first.

### 8.6 Read chat transcripts

- Admin panel → **Chats** (under the `/dashboard/chats` URL) → shows every session with its message count, location, escalation flag, and average rating.
- Click into a session to see the full back-and-forth including which providers were recommended.

### 8.7 See what users are asking about

- Admin panel → **Overview** → **Top Query Themes** — an auto-extracted summary of the last 50 user messages.
- Use this to identify gaps in the directory (e.g., "adult ADHD assessment" trending up may mean LDA of PA should recruit more health professionals in that area).

### 8.8 Escalated sessions

When the AI detects a crisis (self-harm, abuse, emergency), the session is flagged with `escalated = true` and the user is pointed to 988 / 911 / LDA of PA staff. Review escalated sessions promptly — the list is at **Chats**, filter by `escalated = yes`.

---

## 9. What can break and how to tell

| Symptom | Most likely cause | Fix |
|--------|-------------------|-----|
| Chat on the public portal returns an error | OpenAI balance is $0, OR OpenAI API key is invalid, OR Railway is paused | §6 (OpenAI credits + key), §5 (Railway billing) |
| Admin panel login fails | Railway is paused, OR password was changed and not communicated | §5, or ask a developer to re-set the password hash via §7.2 |
| Admin dashboard shows 0 providers | Railway database was reset, OR backend is down | Check Railway logs (§9.2) — likely a deploy issue |
| A user reports a bug | Screenshot + time + steps to reproduce → send to the Tech Lead (§10) | |

### 9.1 Quick health check (takes 60 seconds)

1. Open https://ldapa-portal-production.up.railway.app/api/health — should show `{"status":"ok"}`.
2. Open https://ldapa-public-portal.vercel.app → click into the chat → send "hello" → you should get a real response.
3. Open https://ldapa-admin-panel.vercel.app → log in → see provider count > 0 on the dashboard.

If all three pass, the system is healthy.

### 9.2 Where to look when something's broken

- **Railway logs:** https://railway.com/project/dd7377a4-0528-4aa5-bc96-cf5f08f015b9 → click the backend service → **Deployments** tab → top deployment → **View Logs**. Any Python error traceback will be here.
- **Vercel deployment status:** https://vercel.com/ → the project → **Deployments** tab. Red = failed build. Click for the build log.
- **OpenAI usage / errors:** https://platform.openai.com/usage — confirms you have balance and requests are succeeding.

---

## 10. Post-Deployment Support

We provide **maintenance and support to resolve any implementation issues and problems** during the agreed post-deployment support window.

**Support window:** through **July 31st, 2026**.

**Tech Lead:** Hazem El-Sayed

**Email:** `hmelsaye@andrew.cmu.edu`

**Phone / WhatsApp:** +974 3350 1813

### When to reach out

- Something is broken and the quick health check in §9.1 doesn't explain why.
- You want help with a task that requires code changes (e.g. rotating the admin password, adding a new admin user, setting up a custom domain).
- The documentation in this handoff folder doesn't answer your question.
- You want advice before doing something destructive (deleting data, migrating).

### What to include in your email

To get a faster response, include:

- Which URL you were using when the problem happened.
- A screenshot.
- The approximate time (e.g. "around 2:30pm ET on Tuesday").
- What you had just clicked / typed.

---

## 11. Glossary

| Term | What it means |
|------|---------------|
| **Backend** | The behind-the-scenes service that stores data and talks to OpenAI. Lives on Railway. You don't visit it directly; the websites talk to it for you. |
| **Frontend** | A website. We have two: the public portal and the admin panel. Both live on Vercel. |
| **API key** | A long password-like string (e.g. `sk-proj-abc123…`) that lets our backend talk to OpenAI. Treat it like a password. |
| **Environment variable** | A setting that lives on the hosting platform rather than in the code. The OpenAI key, the database connection string, and the allowed website URLs are all environment variables. |
| **Railway** | The hosting platform running our backend + database. https://railway.com |
| **Vercel** | The hosting platform running our two websites. https://vercel.com |
| **OpenAI** | The company that provides the AI model we use. https://platform.openai.com |
| **Postgres / PostgreSQL** | The database technology that stores providers and chat history. Managed by Railway. |
| **Deploy** | Pushing a new version of the code to the live server. When a developer pushes to GitHub, Railway and Vercel automatically deploy. |
| **Brilliant Directories** | The SaaS that previously hosted the LDA of PA directory. Our initial 3,610 providers came from a CSV export of it. |
| **Bcrypt / JWT** | Technical terms for "password hashing" and "login token." You do not need to care about them day-to-day. |
| **CORS** | A security rule that says "only these specific websites may call the backend." Set via the `CORS_ORIGINS` environment variable on Railway. |
| **[PROVIDERS]** | A placeholder the AI puts in its reply text. The website replaces it with the actual provider cards before showing to the user. |

---

## 12. A final note

You do not need to become a developer to run this. The admin panel + this handoff doc will cover 95% of what you need. For the remaining 5% — code changes, infrastructure adjustments, bug fixes — reach out to the Tech Lead (§10). After July 31st, 2026 the support engagement ends, and at that point you'll want to identify a continuation developer (either internal hire or contractor) using this handoff folder as their onboarding.

Good luck.
