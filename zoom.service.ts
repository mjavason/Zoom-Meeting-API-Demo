import axios from 'axios';
import dotenv from 'dotenv';
import { Buffer } from 'buffer';

dotenv.config();

const ZOOM_API_URL = 'https://api.zoom.us/v2';

export class ZoomService {
  private static async getAccessToken(): Promise<string> {
    // Base64 encode client_id:client_secret
    const credentials = `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');

    // Create the URLSearchParams object for the form data
    const body = new URLSearchParams();
    body.append('grant_type', 'account_credentials');
    body.append('account_id', process.env.ZOOM_ACCOUNT_ID || '');

    // Make the POST request to get the access token
    const tokenResponse = await axios.post(
      'https://zoom.us/oauth/token',
      body, // Pass the body as URLSearchParams
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${encodedCredentials}`, // Add encoded client_id:client_secret here
        },
      }
    );

    // Return the access token from the response
    return tokenResponse.data.access_token;
  }

  public static async getUserMeetings(userId: string): Promise<any> {
    const token = await this.getAccessToken(); // OAuth or JWT token

    const response = await axios.get(
      `${ZOOM_API_URL}/users/${userId}/meetings`,
      {
        params: {
          type: 'past', // or 'past' or 'live' depending on what you want
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  }

  public static async getMeetingParticipants(meetingId: string): Promise<any> {
    const token = await this.getAccessToken(); // OAuth

    const response = await axios.get(
      `${ZOOM_API_URL}/metrics/meetings/${meetingId}/participants`,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Replace with JWT if using JWT
        },
      }
    );

    return response.data;
  }

  public static async getMeetingDetails(meetingId: string): Promise<any> {
    const token = await this.getAccessToken(); // OAuth

    const response = await axios.get(`${ZOOM_API_URL}/meetings/${meetingId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }
}
