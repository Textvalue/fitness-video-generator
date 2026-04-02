
![📄](https://a.slack-edge.com/production-standard-emoji-assets/15.0/apple-medium/1f4c4@2x.png) PRD: AI Trainer Video Generator Web App

1. Product Overview
   A web-based application that allows users to upload an image of a fitness trainer and automatically generate high-quality exercise videos. The system uses an image-generation API ("Nano Banana") to place the trainer in a specific environment, and an AI video-generation API (Google Veo 3.1+) to animate the trainer performing specific exercises based on a text description.
2. User Flow

* **Upload:** User uploads a base photo of the trainer.
* **Select/Define:** User selects an exercise from the library (or adds a new one) and defines the background/environment.
* **Generate Image:** The app calls "Nano Banana" to generate a static image of the trainer in the starting position of the exercise within the defined environment.
* **Generate Video:** The generated image + the exercise description are sent to the Veo API (user can select the Veo version) to generate the video.
* **Store & Track:** The video is saved to AWS S3, metadata is saved to the local database, and the exact API cost for that specific generation is logged.

3. Key Features & Functional Requirements
   ![:camera_with_flash:](https://a.slack-edge.com/production-standard-emoji-assets/15.0/apple-medium/1f4f8@2x.png) 3.1 Trainer & Environment Management

* **Image Upload:** Interface to upload and store base images of the trainer.
* **Environment Setup:** Ability to define and save fixed environments/backgrounds (e.g., "Modern gym," "Outdoor track") via text prompts or presets.

![:weight_lifter:](https://a.slack-edge.com/production-standard-emoji-assets/15.0/apple-medium/1f3cb-fe0f@2x.png) 3.2 Exercise Library

* **Pre-loaded Database:** Import the initial list of 50 predefined exercises.
* **CRUD Operations:** Users can Create, Read, Update, and Delete exercises.
* **Data Structure:** Each exercise must contain at least a *Title* and a *Detailed Prompt/Description* (how the exercise is performed).

![:robot_face:](https://a.slack-edge.com/production-standard-emoji-assets/15.0/apple-medium/1f916@2x.png) 3.3 AI Generation Pipeline
• **Image Generation (Nano Banana):** Generates the initial frame (Trainer + Environment + Exercise starting pose).
• **Video Generation (Veo API):**
Accepts the generated image and exercise description as inputs.
**Version Selector:** Dropdown to select the Veo API version (e.g., Veo 3.1, Veo 3.0).
![💾](https://a.slack-edge.com/production-standard-emoji-assets/15.0/apple-medium/1f4be@2x.png) 3.4 Storage & Asset Management

* **Media Storage:** All generated images and videos must be stored in AWS S3 (or a local equivalent).
* **Regeneration/Playback:** Users can view previously generated videos from the database without needing to regenerate (and pay for) them again.

![💰](https://a.slack-edge.com/production-standard-emoji-assets/15.0/apple-medium/1f4b0@2x.png) 3.5 Cost Tracking & Analytics

* **Cost Logging:** The system calculates and logs the exact API cost for every generated image and video.
* **Cost Dashboard:** A simple view to see "Cost per video" and "Total spent" across the application.

4. Technical Architecture (Proposed)
   • **Frontend:** Next.js / React / Vue (for a responsive web interface).
   • **Backend:** Node.js / Python (FastAPI/Django) to handle long-polling/webhooks for video generation APIs.
   • **Database:** PostgreSQL or local SQLite (to store exercise lists, metadata, S3 links, and cost logs).
   • **Storage:** AWS S3 (or Cloudflare R2 / local storage).
   • **External APIs:**
   *[Banana.dev](http://Banana.dev)** / Nano:* For image generation.
   *Google Veo API:* For Image-to-Video generation.
