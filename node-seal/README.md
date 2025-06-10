# Node-SEAL Implementation

This is the **Node.js implementation** of the homomorphic encryption project using the node-seal library. This version provides a full JavaScript/TypeScript stack with a modern Next.js frontend and comprehensive UI components.

## Architecture

- **Backend**: Node.js with Express and node-seal library
- **Frontend**: Next.js with TypeScript and modern UI components (Radix UI)
- **Communication**: RESTful API with CORS support
- **Styling**: Modern CSS with component libraries

## Prerequisites

- **Node.js**: Version 18 or higher (recommended: latest LTS)
- **npm**: Version 8 or higher (comes with Node.js)

## Installation and Setup

### 1. Navigate to Node-SEAL Directory
```bash
cd applied-cryptography-group08/node-seal
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## Running the Application

### Development Mode (Recommended)

#### Start the Backend
```bash
# From node-seal/backend directory
npm run dev
```
The backend will start on `http://localhost:3001` with hot-reload enabled.

#### Start the Frontend
```bash
# From node-seal/frontend directory
npm run dev
```
The frontend will be available at `http://localhost:3000` with Turbopack for fast development.

### Production Mode

#### Backend
```bash
# From node-seal/backend directory
npm start
```

#### Frontend
```bash
# From node-seal/frontend directory
npm run build
npm start
```

## Frontend Features

The Next.js frontend includes:

- **Modern UI Components**: Built with Radix UI primitives
- **TypeScript**: Full type safety and better development experience
- **Responsive Design**: Mobile-first approach with modern styling
- **Component Library**: Reusable UI components including:
  - `benchmark-visualization.tsx`: Performance metrics display
  - `dataset-analysis.tsx`: Healthcare data analysis interface
  - `performance-metrics-display.tsx`: Real-time performance monitoring
  - `scheme-parameters.tsx`: Encryption parameter configuration
  - `simple-addition.tsx`: Basic encryption operations demo

### Key Frontend Components

```
src/
├── app/                    # Next.js app router
│   ├── page.tsx           # Main page
│   ├── layout.tsx         # App layout
│   └── benchmark/         # Benchmark pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── [feature].tsx     # Feature-specific components
├── config/
│   └── api.ts            # API configuration
└── lib/                  # Utility functions
```

## Backend Features

The Express.js backend provides:

- **node-seal Integration**: JavaScript bindings for Microsoft SEAL
- **RESTful API**: Clean API endpoints for encryption operations
- **CORS Support**: Configured for frontend communication
- **Logging**: Comprehensive request and error logging
- **Healthcare Data Processing**: Specialized endpoints for medical data

### Key Backend Files

```
backend/
├── src/
│   └── index.js          # Main server file
├── logger.js             # Logging configuration
├── healthcare_dataset.csv # Sample healthcare data
└── package.json          # Dependencies and scripts
```

## Available Scripts

### Backend Scripts
- `npm run dev`: Start development server with nodemon
- `npm start`: Start production server
- `npm test`: Run tests (placeholder)

### Frontend Scripts
- `npm run dev`: Start development server with Turbopack
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [node-seal Documentation](https://github.com/morfix-io/node-seal)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Express.js Documentation](https://expressjs.com/)

## Switching to Microsoft SEAL Version

If you need higher performance or prefer C++, check out the [Microsoft SEAL version](../microsoft-seal/README.md) which offers:
- Native C++ performance
- Direct Microsoft SEAL integration
- Lower-level control over encryption operations