# Full-Stack Quality Management System (QMS)

## Project Overview

This project is a Full-Stack Quality Management System built using Next.js. It is designed to manage and track academic years, courses, criteria, and user progress within an educational institution's quality assurance unit.

## Technologies Used

The project utilizes the following key technologies and libraries:

*   **Next.js:** React framework for building server-rendered and statically generated web applications.
*   **React:** JavaScript library for building user interfaces.
*   **TypeScript:** Typed superset of JavaScript that compiles to plain JavaScript.
*   **Tailwind CSS:** A utility-first CSS framework for rapidly building custom designs.
*   **shadcn/ui:** A collection of reusable components built with Radix UI and Tailwind CSS (inferred from `@/components/ui`).
*   **date-fns:** A modern JavaScript date utility library.
*   **lucide-react:** A set of beautiful open-source icons.
*   **sonner:** An opinionated toast component for React.
*   **react-i18next:** Internationalization framework for React.

## API Fetching

The project uses a custom `apiClient` utility for making HTTP requests to the backend API. This client likely wraps the browser's native `fetch` API or a similar library (like Axios) to handle requests, manage base URLs, and potentially include authentication headers (using the `useAuth` context).

An example of its usage can be seen in files like `app/dashboard/academic-years/page.jsx`, where data is fetched using calls such as `apiClient('/academic-years/...', { method: 'GET' })` or `apiClient('/academic-years/create_new_year/', { method: 'POST', body: JSON.stringify(...) })`.

## Project Structure (Observed)

The project seems to follow a structure typical for Next.js applications, with some parts potentially using the Pages Router (`src/pages`) and others using the App Router (`app`). Key directories include:

*   `app/`: Contains App Router routes, layouts, and pages (e.g., `app/dashboard`).
*   `src/pages/`: Contains Pages Router pages (e.g., `src/pages/_app.tsx`, `src/pages/_document.tsx`).
*   `src/components/`: Reusable UI components.
*   `src/contexts/`: React contexts for state management.
*   `src/lib/`: Utility functions or helper modules.
*   `public/`: Static assets like images (e.g., `public/favicon.png`).
*   `hooks/`: Custom React hooks.

## How to Run the Project

To get the project running on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <project_directory>
    ```
    Replace `<repository_url>` with the actual URL of your Git repository and `<project_directory>` with the name of the cloned folder.

2.  **Install dependencies:**
    Use your preferred package manager (npm, yarn, or pnpm).
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the project root and add necessary environment variables, such as API endpoints or authentication details. Consult the project's documentation or ask the developer for required variables.
    ```env
    #  environment variable
    NEXT_PUBLIC_API_URL=http://localhost:8000/api
    ```

4.  **Run the development server:**
    ```bash
    npm run deve
   

5.  **Access the application:**
    Open your web browser and go to `http://localhost:3000` (or the port indicated in your terminal). 