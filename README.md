# Learnforge

Welcome to Learnforge! This is a web application for creating and undertaking personalized learning missions. Users can enroll in existing courses, browse available missions, and create their own tailored learning paths.

## Tech Stack

- **Frontend:** React, TypeScript
- **Styling:** Tailwind CSS
- **Containerization:** Docker & Nginx
- **AI Integration (Planned):** Google Gemini API

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) must be installed on your machine.

### Running Locally with Docker

Follow these steps to get the application running on your local machine.

1.  **Clone the repository (if you haven't already):**
    ```bash
    # git clone <repository-url>
    # cd learnforge
    ```

2.  **Build the Docker image:**
    Open your terminal in the project root directory and run the following command. This will build the Docker image and tag it as `learnforge`.
    ```bash
    docker build -t learnforge .
    ```

3.  **Run the Docker container:**
    Once the image is built, run the following command to start a container from it. This command maps port `3000` on your host machine to port `80` inside the container.
    ```bash
    docker run -p 3000:80 learnforge
    ```

4.  **Access the application:**
    Open your favorite web browser and navigate to [http://localhost:3000](http://localhost:3000). You should see the Learnforge login page.

## Design Guidelines

The visual and UX guidelines for this project are documented in the `design_guideline.md` file.
