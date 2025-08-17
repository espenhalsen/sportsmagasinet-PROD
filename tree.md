# Sportsmagasinet Project Structure

```
sportsmagasinet/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── logout/
│   │   │   │   ├── register/
│   │   │   │   └── route.js
│   │   │   ├── verify/
│   │   │   ├── articles/
│   │   │   ├── clubs/
│   │   │   ├── licenses/
│   │   │   ├── invites/
│   │   │   │   ├── create/
│   │   │   │   │   └── route.js
│   │   │   │   ├── link/
│   │   │   │   │   └── route.js
│   │   │   │   └── verify/
│   │   │   │       └── route.js
│   │   │   ├── payments/
│   │   │   ├── sms/
│   │   │   └── users/
│   │   │       └── me/
│   │   │           └── route.js
│   │   ├── dashboard/
│   │   │   ├── admin/
│   │   │   ├── agent/
│   │   │   │   └── page.js
│   │   │   ├── club/
│   │   │   │   └── page.js
│   │   │   ├── seller/
│   │   │   │   └── page.js
│   │   │   └── subscriber/
│   │   │       └── page.js
│   │   ├── register/
│   │   │   ├── [token]/
│   │   │       └── page.js
│   │   ├── articles/
│   │   │   └── [slug]/
│   │   ├── profile/
│   │   ├── login/
│   │   └── (public)/
│   ├── components/
│   │   ├── ui/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── articles/
│   │   └── common/
│   ├── lib/
│   │   ├── firebase/
│   │   ├── stripe/
│   │   ├── resend/
│   │   ├── twilio/
│   │   └── auth/
│   ├── hooks/
│   ├── utils/
│   ├── contexts/
│   └── styles/
├── public/
│   └── icons/
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tree.md
└── package.json
```
