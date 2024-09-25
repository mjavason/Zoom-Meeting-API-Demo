import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { setupSwagger } from './swagger.config';
import { ZoomService } from './zoom.service';

//#region App Setup
const app = express();

dotenv.config({ path: './.env' });
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));
setupSwagger(app, BASE_URL);

//#endregion App Setup

//#region Code with Swagger Annotations

/**
 * @swagger
 * /user/{userId}/meetings:
 *   get:
 *     summary: Retrieve all meetings for a user
 *     description: Get a list of all scheduled meetings for a specific user by their userId or email.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The user's Zoom ID or email address.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of meetings.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meetings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The meeting ID.
 *                       topic:
 *                         type: string
 *                         description: The meeting topic.
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                         description: The start time of the meeting.
 *       500:
 *         description: Failed to retrieve user meetings.
 */
app.get('/user/:userId/meetings', async (req, res) => {
  const { userId } = req.params;
  try {
    const meetings = await ZoomService.getUserMeetings(userId);
    res.json(meetings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to get user meetings' });
  }
});

/**
 * @swagger
 * /meeting/{meetingId}/participants:
 *   get:
 *     summary: Get participants of a meeting
 *     description: Retrieve the list of participants for a specific Zoom meeting by its meetingId.
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         description: The meeting ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of participants.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The participant's ID.
 *                       name:
 *                         type: string
 *                         description: The participant's name.
 *                       join_time:
 *                         type: string
 *                         format: date-time
 *                         description: The time the participant joined the meeting.
 *       500:
 *         description: Failed to retrieve meeting participants.
 */
app.get('/meeting/:meetingId/participants', async (req, res) => {
  const { meetingId } = req.params;
  try {
    const participants = await ZoomService.getMeetingParticipants(meetingId);
    res.json(participants);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to get meeting participants' });
  }
});

/**
 * @swagger
 * /meeting/{meetingId}/details:
 *   get:
 *     summary: Get meeting details
 *     description: Retrieve the details of a specific Zoom meeting by its meetingId.
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         description: The meeting ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The details of the meeting.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The meeting ID.
 *                 topic:
 *                   type: string
 *                   description: The topic of the meeting.
 *                 start_time:
 *                   type: string
 *                   format: date-time
 *                   description: The scheduled start time of the meeting.
 *                 duration:
 *                   type: integer
 *                   description: The duration of the meeting in minutes.
 *       500:
 *         description: Failed to retrieve meeting details.
 */
app.get('/meeting/:meetingId/details', async (req, res) => {
  const { meetingId } = req.params;
  try {
    const meetingDetails = await ZoomService.getMeetingDetails(meetingId);
    res.json(meetingDetails);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to get meeting details' });
  }
});

//#endregion

//#region Server Setup

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Call a demo external API (httpbin.org)
 *     description: Returns an object containing demo content
 *     tags: [Default]
 *     responses:
 *       '200':
 *         description: Successful.
 *       '400':
 *         description: Bad request.
 */
app.get('/api', async (req: Request, res: Response) => {
  try {
    const result = await axios.get('https://httpbin.org');
    return res.send({
      message: 'Demo API called (httpbin.org)',
      data: result.status,
    });
  } catch (error: any) {
    console.error('Error calling external API:', error.message);
    return res.status(500).send({ error: 'Failed to call external API' });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Health check
 *     description: Returns an object containing demo content
 *     tags: [Default]
 *     responses:
 *       '200':
 *         description: Successful.
 *       '400':
 *         description: Bad request.
 */
app.get('/', (req: Request, res: Response) => {
  return res.send({ message: 'API is Live!' });
});

/**
 * @swagger
 * /obviously/this/route/cant/exist:
 *   get:
 *     summary: API 404 Response
 *     description: Returns a non-crashing result when you try to run a route that doesn't exist
 *     tags: [Default]
 *     responses:
 *       '404':
 *         description: Route not found
 */
app.use((req: Request, res: Response) => {
  return res
    .status(404)
    .json({ success: false, message: 'API route does not exist' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // throw Error('This is a sample error');
  console.log(`${'\x1b[31m'}`); // start color red
  console.log(`${err.message}`);
  console.log(`${'\x1b][0m]'}`); //stop color

  return res
    .status(500)
    .send({ success: false, status: 500, message: err.message });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});

// (for render services) Keep the API awake by pinging it periodically
// setInterval(pingSelf(BASE_URL), 600000);

//#endregion
