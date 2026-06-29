# RazorPay Take Home

A minimal reimbursement management system demonstrating role-based access control (RBAC) with an Express backend and React/Vite frontend.

## Install dependencies

### Backend
```bash
cd Backend
npm install
```

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
```

## Start the application

### Backend
```bash
cd Backend
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

## Notes
- The backend is served at `http://localhost:7002`.
- The frontend runs at `http://localhost:5173` and proxies `/rest` to the backend.
- Use `@org.com` email addresses for registration.
