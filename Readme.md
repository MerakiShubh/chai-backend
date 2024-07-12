# videoTube Backend

## Overview

videoTube is a comprehensive video platform where users can:

- Upload and play videos 📹
- Like and comment on videos ❤️💬
- Save liked videos in a special section
- Track watched videos in your watch history
- Enjoy optimistic view counting for a smooth experience 📊

## Tech Stack

- **Frontend**: React, Redux, React Query, Axios, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, Mongoose ORM
- **Deployment**: Docker, Nginx, Render

## Features

- Upload and play videos
- Like and comment on videos
- Save liked videos
- Track watched videos
- Optimistic view counting

## Demo

Watch the demo video for a walkthrough of the project:
[![Watch the video](https://raw.githubusercontent.com/MerakiShubh/videotube-backend/main/public/assests/projectimg.jpg)](https://vimeo.com/982999217?share=copy)

## Live Project

Check out the live project: [Live Project](https://videotube.merakishubh.com)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- npm
- MongoDB

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/MerakiShubh/videotube-backend.git
   ```
2. Install npm pachages

   ```sh
   npm install

   ```

3. Set up environment variables
   Copy the .env.sample file to .env and fill in the necessary values.

   ```sh
   cp .env.sample .env

   ```

4. Start the development server
   ```sh
   npm run dev
   ```

#### Use Docker image

1. Pull the Docker image from Docker Hub:

   ```sh
   docker pull merakishubh/videotube:latest

   ```

2. Create a .env file based on the .env.sample file and fill in the necessary values.
3. Run the Docker container:
   ```sh
   docker run --env-file .env -p 3000:3000 merakishubh/videotube:latest
   ```
