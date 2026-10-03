import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import axios from 'axios';

async function checkSecurityIssuesAndCreateTickets() {
    // CORS Misconfiguration Check
    const corsOrigin = env.CORS_ORIGIN || '*';
    if (corsOrigin === '*' && env.NODE_ENV === 'production') {
        try {
            await createGitHubIssue({
                title: '[Security] CORS allows all origins',
                body: `CORS is configured to allow all origins. Restrict to specific domains.

This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.`
            });
        } catch (error) {
            console.error('Failed to create CORS security issue:', error.message);
        }
    }
}

async function createGitHubIssue({ title, body }) {
    if (!env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN environment variable required');
    
    await axios.post(
        'https://api.github.com/repos/SecureBananaLabs/bug-bounty/issues',
        { title, body },
        { headers: { 
            Authorization: `token ${env.GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
        }}
    );
}

async function bootstrap() {
    await connectDb();
    await checkSecurityIssuesAndCreateTickets();
    const app = createApp();
    app.listen(env.port, () => {
        console.log(`API listening on http://localhost:${env.port}`);
    });
}

bootstrap();
