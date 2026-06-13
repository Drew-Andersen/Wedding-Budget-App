# Wedding Budget Tracker
 
A full-stack wedding budget tracker with role-based access — couples can edit, family can view.
 
## Tech Stack
 
| Layer    | Technology |
|----------|------------|
| Frontend | React 18 + Vite |
| Backend  | Node.js + Express |
| Auth     | JWT (httpOnly cookies) + bcrypt |
 
---
 
## Project Structure
 
```
wedding-budget/
├── server/                     
│   ├── server.js               
│   ├── db.js                  
│   ├── middleware/
│   │   └── auth.js             
│   └── routes/
│       ├── authRoutes.js       
│       └── budgetRoutes.js     
│   └── controller/
│       ├── authController.js         
│       └── budgetController.js       
│   └── schema/
│       ├── schema.js           
│       └── schema-dev.js      
├── client/                    
│   ├── src/                    
│   │   ├── components/
│   │   │   ├── AuthShell.jsx   
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── BudgetApp.jsx  
│   │   │   ├── BudgetTable.jsx 
│   │   │   └── BreakdownTabs.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.jsx     
│   │   │   └── useBudget.js   
│   │   ├── lib/
│   │   │   ├── api.js          
│   │   │   └── constants.js   
│   │   ├── App.jsx             
│   │   ├── App.css  
│   │   ├── main.jsx  
│   │   ├── index.html        
│   │   └── vite.config.js
├── render.yaml    
├── LICENSE         
└── README.md
```
 
---
 
## Local Development
 
### 1. Prerequisites
- Node.js 18+
- PostgreSQL running locally (or use a free Render PostgreSQL)
### 2. Clone and install
 
```bash
git clone https://github.com/Drew-Andersen/Wedding-Budget-App
cd wedding-budget
 
# Install dependencies 
npm install
 
### 3. Set up the database
 
```bash
# Create a local database
createdb wedding_budget
 
# Run the schema
psql wedding_budget -f schema.sql
```
 
### 4. Configure environment
 
```bash
cd server
touch server/.env
```
 
Edit `server/.env`:
```
DATABASE_URL=postgresql://localhost/wedding_budget
JWT_SECRET=any_long_random_string_for_local_dev
PORT=3001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```
 
### 5. Run both servers
 
```bash
# In one terminal — start the API from the root folder "WEDDING_BUDGET_APP"
npm run develop
```
 
Open http://localhost:5173
 
---
 
## How roles work
 
| Role | Can do |
|------|--------|
| **Editor** (couple) | Add, edit, delete budget items. Sees couple code in header. |
| **Viewer** (family/guests) | Read-only access to the same budget. No edit controls shown. |
 
Editors get a **couple code** on registration. They share this code with family members, who use it when registering their own viewer accounts.
 
---
 
## License
MIT License

## Author
Drew Andersen