# **Portfolio Management 📊**

A comprehensive portfolio management application built with Next.js, TypeScript, and Firebase. It provides a dashboard to manage various aspects of a personal portfolio, including projects, skills, certifications, and timeline events. The application is designed to be a central hub for maintaining and showcasing professional accomplishments.

## **✨ Features**

* **Dashboard Overview**: A central dashboard to visualize key portfolio statistics, recent activities, and GitHub commits.  
* **Project Management**: A dedicated section to add, edit, and delete project details, including descriptions, links, and media.  
* **Skills Management**: Organize technical skills into categories, manage key skills, and display proficiency levels.  
* **Certifications Hub**: A place to list and manage professional certifications with relevant details like issuer, date, and credential link.  
* **Timeline of Achievements**: A chronological view of career milestones, educational background, and other significant events.  
* **File Storage**: Integrated with Vercel Blob storage for managing and serving file assets.  
* **Authentication**: Secure login and user management powered by Firebase Authentication.

## **🚀 Tech Stack**

* **Framework**: [Next.js](https://nextjs.org/)  
* **Language**: [TypeScript](https://www.typescriptlang.org/)  
* **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)  
* **Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore)  
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)  
* **UI Components**: [Radix UI](https://www.radix-ui.com/) and [shadcn/ui](https://ui.shadcn.com/)  
* **Animations**: [Framer Motion](https://www.framer.com/motion/)  
* **File Storage**: [Vercel Blob](https://vercel.com/blob)

## **🛠️ Getting Started**

To get a local copy up and running, follow these simple steps.

### **Prerequisites**

* Node.js (v18.18.0 or later)  
* npm, yarn, or pnpm

### **Installation**

1. **Clone the repo**  
   git clone https://github.com/jadhavsharad/portfolio-management.git

2. **Install NPM packages**  
   npm install

3. **Set up your environment variables** by creating a .env.local file in the root of your project and adding the necessary Firebase and Vercel Blob credentials.  
4. **Run the development server**  
   npm run dev

## **📂 Project Structure**

The project follows a standard Next.js app directory structure.

* src/app/: Contains the main pages of the application.  
  * api/: API routes for handling backend logic.  
  * (pages)/: Subdirectories for different sections like projects, skills, etc.  
* src/components/: Reusable components used throughout the application.  
  * ui/: UI components built with Radix UI and styled with Tailwind CSS.  
  * layout/: Components that define the structure of the pages, like the sidebar and header.  
* src/lib/: Utility functions and Firebase configuration.  
* src/contexts/: React context for authentication.  
* public/: Static assets like images and fonts.

## **🌐 Deployment**

This application is deployed on the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme). The easiest way to deploy your Next.js app is to use the Vercel platform from the creators of Next.js.

## **🔗 API Endpoints**

The application includes API endpoints for handling blob storage:

* POST /api/blob: Uploads a file to Vercel Blob storage.  
* GET /api/blob: Retrieves a list of all files from the blob storage.  
* DELETE /api/blob: Deletes a file from the blob storage using its URL.

## **🔐 Authentication**

Authentication is handled using Firebase Authentication, providing a secure and reliable way to manage user access. The withAuth higher-order component is used to protect routes that require authentication.

## **🎨 UI Components**

The user interface is built with a combination of custom components and UI primitives from Radix UI and shadcn/ui. This allows for a flexible and accessible design system that is easy to maintain and extend.
