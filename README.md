
# Cloud-Bill Manager

Cloud-Bill Manager is a web-based invoicing and inventory management system designed for businesses. It offers secure login, centralized cloud-based data storage, and mobile accessibility, allowing users to manage products, customers, and invoices efficiently.

## **Features**
- Centralized **MongoDB Cloud Database** accessible from anywhere.
- **Secure Login** and user role management.
- **Business Product Management** with unique IDs, GST, and inventory tracking.
- **Serialized Invoice Numbers** and invoice filtering by dates.
- **Browser Printing and PDF Downloading** of invoices.
- **Mobile and Desktop Accessibility** with responsive design.

## **Project Structure**
```
cloud-bill-manager/
├── backend/                  # Backend logic with Express and MongoDB
│   ├── DB/                   # Database configuration
│   │   └── database.js
│   ├── controllers/          # Controllers for handling business logic
│   │   ├── customer.controller.js
│   │   ├── organization.controller.js
│   ├── middlewares/          # Middleware functions
│   │   ├── auth.middleware.js
│   │   ├── errorHandler.js
│   ├── models/               # Mongoose models for MongoDB
│   │   ├── customer.model.js
│   │   ├── inventory.model.js
│   │   ├── invoice.model.js
│   │   ├── organization.model.js
│   │   ├── unitofmeasure.model.js
│   ├── routes/               # API routes
│   │   ├── organization.routes.js
│   ├── utils/                # Utility functions
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── AsyncHandler.js
│   ├── app.js                # Express app setup
│   ├── index.js              # Entry point of the backend
│   ├── package.json
│   ├── package-lock.json
├── frontend/                 # React-based frontend
│   ├── src/
│   ├── public/
│   ├── package.json
├── .gitignore
├── README.md
└── package-lock.json

```

## **Technologies**
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React.js
- **Authentication**: JSON Web Tokens (JWT)
- **Deployment**: BACKEND RENDER and FRONTEND Netlify (DB MongoDB Atlas)

## **Getting Started**

### **Prerequisites**
- Node.js
- npm or yarn
- MongoDB Cloud (Atlas)
- Git

### **Installation**

1. **Clone the repository with submodules:**  
   If you are cloning for the first time, use:
   ```bash
   git clone --recurse-submodules https://github.com/santoshjogdand/cloud-bill-manager.git
   cd cloud-bill-manager
   ```

   If you have already cloned the repository but forgot the submodules, run:
   ```bash
   git submodule update --init --recursive
   ```

2. **Install dependencies for both backend and frontend:**
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. **To pull the latest changes including submodules:**
   ```bash
   git pull --recurse-submodules
   git submodule update --remote --merge
   ```

### **Environment Variables**
Create `.env` files in both `backend` and `frontend` with the following variables:

#### **Backend `.env`**
```
PORT=5000
DATABASE_URL=mongodb+srv://your-db-url
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
```

#### **Frontend `.env`**
```
REACT_APP_API_URL=http://localhost:5000/api
```

### **Running the Project**
1. **Backend**:  
   Navigate to the backend folder and run:
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend**:  
   Navigate to the frontend folder and run:
   ```bash
   cd frontend
   npm start
   ```

### **Scripts**
- `npm run dev` (backend) – Starts the backend server with live reload.
- `npm start` (frontend) – Starts the React development server.

## **Contributing**
1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push the branch: `git push origin feature-name`
5. Create a pull request.

## **License**
This project is licensed under the MIT License. See the LICENSE file for details.
