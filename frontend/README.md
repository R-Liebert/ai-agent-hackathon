# AI Launchpad UI

The AI Launchpad is a powerful solution that leverages OpenAI's model to enhance internal communication and productivity. It can assist with a wide range of tasks, from answering questions and generating content to helping with coding and translation. This repository is the user interface of this tool

## Key Features

- **DSB Chat**: Product that allows users to ask questions, generate text content, assist with tasks like coding and translation. Also user can follow the user's chat history.

- **Meetings Notes Creator** (in development): Create a summary and actions points of the meeting using the transcription from the Teams recorded session.

- **Image Creator**: Allows DSB employees to create realistic images from natural language text prompts.

- **Document Chat**: Seamlessly turn your documents into interactive conversations with AI! Upload, ask questions, and unlock a whole new level of document interaction.

- **Job Post Creator** (in development): A product that allows users to generate job posts using a pre-trained model.

- **History Chat** (in development): Inquiry about the historical facts of DSB.

## Technology Stack

- **React Application**: Crafted using the dynamic and responsive React framework for a smooth user experience.
- **TypeScript**: Employs TypeScript to enhance code maintainability, improve type checking, and streamline development.

## Getting Started

1. **Docker Setup**: Make sure Docker is installed on your system.
2. **Repository Clone**: Clone this repository to your local machine.
3. **Navigate and Build**: Navigate to the project directory and locate the `src` folder.
4. **Build the Docker Image**: Build the Docker image using the command `docker build -t reporting-tool .`.
5. **Run the Container**: Launch the Docker container with `docker run -p 3000:3000 reporting-tool`.
6. **Access the App**: Open your web browser and access the application at `http://localhost:3000`.

## Environments

- TST: [https://launchpad-ui-tooling.tst.tog.azure.dsb.dk/](https://launchpad-ui-tooling.tst.tog.azure.dsb.dk/)
- PRD: [https://ai.dsb.dk/](https://ai.dsb.dk/)

## Feedback and Support

For any inquiries, issues, or feedback, please create an issue in this repository. Our dedicated team is committed to providing assistance and continually refining the user interface.
