# Image with browsers already downloaded - no need to `npx playwright install ...`
FROM mcr.microsoft.com/playwright:v1.62.1-noble

# Installing PulseAudio to ensure no issues with Firefox
RUN apt-get update \
    && apt-get install -y --no-install-recommends pulseaudio \
    && rm -rf /var/lib/apt/lists/*
